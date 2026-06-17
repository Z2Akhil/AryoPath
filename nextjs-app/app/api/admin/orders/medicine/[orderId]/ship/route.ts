export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { createShipment, schedulePickup, type PickupResult } from '@/lib/services/delhiveryService';
import {
  getMedicineOrderEmail,
  sendMedicineShippedEmail,
} from '@/lib/services/transactionalEmailService';

// Statuses from which an order can be shipped
const SHIPPABLE = ['confirmed', 'prescription_verified'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.MED_ORDERS_EDIT);
  if (!auth.authenticated)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  await connectDB();
  const { orderId } = await params;
  const { weightGrams, schedulePickup: doPickup = false } = await req.json().catch(() => ({}));

  const order = await MedicineOrder.findOne({ orderId });
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

  if ((order as any).awb)
    return NextResponse.json({ success: false, error: 'Order already has an AWB' }, { status: 400 });

  if (!SHIPPABLE.includes(order.status))
    return NextResponse.json({ success: false, error: `Cannot ship order in status '${order.status}'` }, { status: 400 });

  const payment = order.payment as any;
  const isCod = payment?.method === 'cod' || payment?.status === 'cod_pending';
  const addr  = order.shippingAddress as any;

  // Create the forward shipment with Delhivery → assigns AWB
  const result = await createShipment({
    orderId: order.orderId,
    shippingAddress: {
      fullName:     addr.fullName,
      mobile:       addr.mobile,
      addressLine1: addr.addressLine1,
      landmark:     addr.landmark,
      city:         addr.city,
      state:        addr.state,
      pincode:      addr.pincode,
      email:        addr.email,
    },
    items: order.items.map((i: any) => ({ name: i.name, quantity: i.quantity })),
    grandTotal:  order.grandTotal,
    paymentMode: isCod ? 'COD' : 'Prepaid',
    weightGrams: weightGrams ? Number(weightGrams) : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'Failed to create shipment' }, { status: 502 });
  }

  // Persist AWB + status via raw update (bypass cached-schema validation)
  await MedicineOrder.collection.updateOne(
    { _id: order._id },
    { $set: {
      awb:            result.awb,
      courierPartner: 'delhivery',
      trackingUrl:    result.trackingUrl,
      status:         'shipped',
    }}
  );

  // Optionally schedule a warehouse pickup
  let pickup: PickupResult | null = null;
  if (doPickup) {
    pickup = await schedulePickup({ expectedPackages: 1 });
  }

  // Email customer with AWB + tracking
  const updated = await MedicineOrder.findOne({ orderId })
    .populate('userId', 'firstName lastName mobileNumber email').lean();
  getMedicineOrderEmail(order).then(email => sendMedicineShippedEmail(updated ?? order, email)).catch(console.error);

  return NextResponse.json({
    success: true,
    awb: result.awb,
    trackingUrl: result.trackingUrl,
    pickup,
    order: updated,
  });
}
