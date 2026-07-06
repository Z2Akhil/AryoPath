export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';
import Prescription from '@/lib/models/Prescription';
import SiteSettings from '@/lib/models/SiteSettings';
import { getMedicineOrderEmail, sendMedicineConfirmedEmail } from '@/lib/services/transactionalEmailService';
import { createPaymentLink } from '@/lib/services/cashfreePaymentLinkService';

const FREE_DELIVERY_THRESHOLD = 1000; // must match checkout

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MED-${ts}-${rand}`;
};

// POST /api/admin/orders/medicine/book-on-behalf
// Admin/staff books a medicine order for a user (from an uploaded prescription or a phone call).
// Phase 4: COD path only. Payment-link path comes in Phase 5.
export async function POST(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.PRESCRIPTION_BOOKING);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      userId,
      items,               // [{ slug, quantity }]
      shippingAddress,     // { fullName, mobile, addressLine1, email?, city, state, pincode, landmark? }
      paymentMethod,       // 'cod' | 'link'
      prescriptionId,      // optional — link + attach the uploaded Rx, mark it done
    } = body;

    if (!userId || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const isCod  = paymentMethod === 'cod';
    const isLink = paymentMethod === 'link';
    if (!isCod && !isLink) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    // Validate address essentials
    for (const f of ['fullName', 'mobile', 'addressLine1', 'city', 'state', 'pincode']) {
      if (!String(shippingAddress[f] ?? '').trim()) {
        return NextResponse.json({ success: false, error: `Shipping ${f} is required` }, { status: 400 });
      }
    }

    // Target user must exist & be active
    const user = await User.findById(userId).select('_id isActive').lean();
    if (!user || !(user as any).isActive) {
      return NextResponse.json({ success: false, error: 'Target user not found or inactive' }, { status: 404 });
    }

    // Enrich items from catalog (authoritative pricing + stock)
    const enrichedItems: any[] = [];
    for (const item of items) {
      const med = await Medicine.findOne({ slug: item.slug, isPublished: true }).lean();
      if (!med) return NextResponse.json({ success: false, error: `Medicine not found: ${item.slug}` }, { status: 400 });
      if (!(med as any).inStock) return NextResponse.json({ success: false, error: `${(med as any).name} is out of stock` }, { status: 400 });
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      enrichedItems.push({
        medicineId: (med as any)._id,
        slug: (med as any).slug,
        name: (med as any).name,
        type: (med as any).type,
        mrp: (med as any).mrp,
        offerPrice: (med as any).offerPrice,
        discountPercentage: (med as any).discountPercentage ?? 0,
        quantity: qty,
        thumbnail: (med as any).thumbnail ?? null,
        prescriptionRequired: (med as any).prescriptionRequired ?? false,
        packSize: (med as any).packSize ?? '',
      });
    }

    const subtotal      = enrichedItems.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const totalAmount   = enrichedItems.reduce((s, i) => s + i.offerPrice * i.quantity, 0);
    const totalDiscount = subtotal - totalAmount;
    const siteSettings  = await SiteSettings.findOne().lean() as any;
    const courierCharge: number = siteSettings?.medicineCourierCharge ?? 49;
    const deliveryCharge = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : courierCharge;
    const grandTotal     = totalAmount + deliveryCharge;
    const requiresPrescription = enrichedItems.some(i => i.prescriptionRequired);

    // Attach the uploaded prescription files (compliance) if this came from an upload
    let attachedRx: { url: string; publicId: string; uploadedAt: Date }[] = [];
    let prescription: any = null;
    if (prescriptionId) {
      prescription = await Prescription.findById(prescriptionId);
      if (prescription) {
        attachedRx = prescription.files.map((f: any) => ({ url: f.url, publicId: f.publicId, uploadedAt: new Date() }));
      }
    }

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const orderId = generateOrderId();
    // COD → confirmed immediately, no TTL. LINK → pending_payment, 48h TTL until paid.
    const LINK_EXPIRY_HOURS = 48;

    const order: any = await MedicineOrder.create({
      orderId,
      userId,
      items: enrichedItems,
      shippingAddress,
      status: isCod ? 'confirmed' : 'pending_payment',
      requiresPrescription,
      prescriptions: attachedRx as any,
      subtotal,
      totalDiscount,
      totalAmount,
      deliveryCharge,
      grandTotal,
      payment: {
        amount: grandTotal,
        currency: 'INR',
        method: isCod ? 'cod' : 'online',
        status: isCod ? 'cod_pending' : 'pending',
      },
      estimatedDelivery: estimatedDelivery as any,
      bookedByAdmin: true,
      prescriptionRef: prescription?._id,
      // On-behalf link orders live 48h (not the normal 30-min); COD never expires.
      expiresAt: isCod ? null : new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000),
    } as any);

    // ── Payment link path: generate a Cashfree link (auto-sent via SMS/email by Cashfree) ──
    let paymentLinkUrl: string | undefined;
    if (isLink) {
      const link = await createPaymentLink({
        linkId: orderId,
        amount: grandTotal,
        purpose: `Ayropath medicines order ${orderId}`,
        customerName: String(shippingAddress.fullName).trim(),
        customerPhone: String(shippingAddress.mobile).trim(),
        customerEmail: shippingAddress.email ? String(shippingAddress.email).trim() : undefined,
        expiryHours: LINK_EXPIRY_HOURS,
      });

      if (!link.success) {
        // Roll back the order so we don't leave a dangling pending order without a link
        await MedicineOrder.deleteOne({ _id: order._id });
        return NextResponse.json({ success: false, error: link.error || 'Failed to create payment link' }, { status: 502 });
      }

      paymentLinkUrl = link.url;
      await MedicineOrder.collection.updateOne(
        { _id: order._id },
        { $set: { paymentLink: { linkId: link.linkId, url: link.url, expiresAt: link.expiresAt } } }
      );
    }

    // Link + close the prescription request (staff has handled it either way)
    if (prescription) {
      if (!prescription.createdOrderIds.includes(orderId)) {
        prescription.createdOrderIds.push(orderId);
      }
      prescription.status = 'done';
      (prescription as any).handledAt = new Date();
      await prescription.save();
    }

    // COD → confirm email now. Link → confirm email fires on the payment webhook.
    if (isCod) {
      const saved = order as any;
      getMedicineOrderEmail(saved).then(email => sendMedicineConfirmedEmail(saved, email)).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      order: { _id: order._id, orderId, grandTotal, status: order.status },
      paymentLink: paymentLinkUrl,
    }, { status: 201 });
  } catch (err) {
    console.error('[medicine book-on-behalf] error:', err);
    const message = err instanceof Error ? err.message : 'Failed to book order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
