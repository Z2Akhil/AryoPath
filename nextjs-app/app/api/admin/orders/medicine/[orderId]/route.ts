export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import type { MedicineOrderStatus } from '@/types/medicineOrder';

const VALID_STATUSES: MedicineOrderStatus[] = [
  'pending_payment', 'payment_failed', 'confirmed',
  'prescription_required', 'prescription_verified',
  'packed', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'refunded',
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await adminAuth(req);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();

    const { orderId } = await params;
    const body = await req.json();
    const { status, notes, cancellationReason } = body;

    const order = await MedicineOrder.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    if (status) {
      order.status = status;
      if (status === 'delivered' && !order.deliveredAt) (order as any).deliveredAt = new Date();
      if (status === 'cancelled' && !order.cancelledAt) (order as any).cancelledAt = new Date();
    }
    if (notes !== undefined)             order.notes = notes;
    if (cancellationReason !== undefined) order.cancellationReason = cancellationReason;

    await order.save();
    await order.populate('userId', 'firstName lastName mobileNumber email');

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Admin] Medicine order update error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
