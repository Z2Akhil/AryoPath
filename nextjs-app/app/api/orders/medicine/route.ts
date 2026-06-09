import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';
import SiteSettings from '@/lib/models/SiteSettings';

const FREE_DELIVERY_THRESHOLD = 1000; // must match MedicineCheckoutForm

const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return await User.findById(decoded.id).select('_id isActive isVerified').lean();
  } catch {
    return null;
  }
};

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MED-${ts}-${rand}`;
};

// POST /api/orders/medicine — create a medicine order (COD, status: confirmed)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, grandTotal, prescriptions: uploadedPrescriptions, paymentMethod } = body;
    const isCod = paymentMethod === 'cod';

    if (!items?.length || !shippingAddress || !grandTotal) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Validate items against DB
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const med = await Medicine.findOne({ slug: item.slug, isPublished: true }).lean();
        if (!med) throw new Error(`Medicine not found: ${item.slug}`);
        if (!(med as any).inStock) throw new Error(`${(med as any).name} is out of stock`);

        return {
          medicineId: (med as any)._id,
          slug: (med as any).slug,
          name: (med as any).name,
          type: (med as any).type,
          mrp: (med as any).mrp,
          offerPrice: (med as any).offerPrice,
          discountPercentage: (med as any).discountPercentage ?? 0,
          quantity: item.quantity,
          thumbnail: (med as any).thumbnail ?? null,
          prescriptionRequired: (med as any).prescriptionRequired ?? false,
          packSize: (med as any).packSize ?? '',
        };
      })
    );

    const subtotal = enrichedItems.reduce((s: number, i: any) => s + i.mrp * i.quantity, 0);
    const totalAmount = enrichedItems.reduce((s: number, i: any) => s + i.offerPrice * i.quantity, 0);
    const totalDiscount = subtotal - totalAmount;
    const siteSettings = await SiteSettings.findOne().lean() as any;
    const courierCharge: number = siteSettings?.medicineCourierCharge ?? 49;
    const deliveryCharge = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : courierCharge;
    const requiresPrescription = enrichedItems.some((i: any) => i.prescriptionRequired);

    // Estimated delivery: 3-5 business days
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const savedPrescriptions = Array.isArray(uploadedPrescriptions)
      ? uploadedPrescriptions
          .filter((p: any) => p?.url && p?.publicId)
          .map((p: any) => ({ url: p.url, publicId: p.publicId, uploadedAt: new Date() }))
      : [];

    const computedGrandTotal = totalAmount + deliveryCharge;

    const order = await MedicineOrder.create({
      orderId: generateOrderId(),
      userId: (user as any)._id,
      items: enrichedItems,
      shippingAddress,
      status: isCod ? 'confirmed' : 'pending_payment',
      requiresPrescription,
      prescriptions: savedPrescriptions as any,
      subtotal,
      totalDiscount,
      totalAmount,
      deliveryCharge,
      grandTotal: computedGrandTotal,
      payment: {
        amount: computedGrandTotal,
        currency: 'INR',
        method: isCod ? 'cod' : 'online',
        status: isCod ? 'cod_pending' : 'pending',
      },
      estimatedDelivery: estimatedDelivery as any,
      // COD orders are confirmed immediately — no TTL expiry
      expiresAt: isCod ? null : (new Date(Date.now() + 30 * 60 * 1000) as any),
    });

    const saved = order as any;
    return NextResponse.json({ success: true, data: { _id: saved._id, orderId: saved.orderId } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// GET /api/orders/medicine — list user's medicine orders
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '10'));

    const filter = {
      userId: (user as any)._id,
      status: { $nin: ['pending_payment', 'payment_failed'] },
    };

    const [orders, total] = await Promise.all([
      MedicineOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MedicineOrder.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
