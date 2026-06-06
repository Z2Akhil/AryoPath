export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { trackShipment } from '@/lib/services/delhiveryService';
import type { MedicineOrderStatus } from '@/types/medicineOrder';
import {
  sendMedicineConfirmedEmail,
  sendMedicineShippedEmail,
  sendMedicineDeliveredEmail,
  sendMedicineCancelledEmail,
} from '@/lib/services/transactionalEmailService';

const VALID_STATUSES: MedicineOrderStatus[] = [
  'pending_payment', 'payment_failed', 'confirmed',
  'prescription_required', 'prescription_verified',
  'packed', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'refunded',
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.MED_ORDERS_VIEW);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const { orderId } = await params;

    const order = await MedicineOrder.findOne({ orderId })
      .populate('userId', 'firstName lastName mobileNumber email')
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Admin] Medicine order GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.MED_ORDERS_EDIT);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();

    const { orderId } = await params;
    const body = await req.json();
    const { status, notes, cancellationReason, awb } = body;

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

    if (awb !== undefined && awb !== (order as any).awb) {
      (order as any).awb = awb;
      (order as any).courierPartner = 'delhivery';
      (order as any).trackingUrl = awb ? `https://www.delhivery.com/track/package/${awb}` : '';

      if (awb) {
        const tracking = await trackShipment(awb);
        if (tracking) {
          (order as any).courierStatus = tracking.latestStatus;
          (order as any).courierStatusHistory = tracking.events;
          (order as any).courierStatusUpdatedAt = new Date();
          if (tracking.latestStatus.toLowerCase().includes('delivered') && order.status !== 'delivered') {
            order.status = 'delivered';
            (order as any).deliveredAt = new Date();
          }
        }
      }
    }

    await order.save();
    await order.populate('userId', 'firstName lastName mobileNumber email');

    const toEmail: string = order.shippingAddress?.email || (order.userId as any)?.email || '';
    if (status === 'confirmed')  sendMedicineConfirmedEmail(order, toEmail).catch(console.error);
    if (status === 'shipped')    sendMedicineShippedEmail(order, toEmail).catch(console.error);
    if (status === 'delivered')  sendMedicineDeliveredEmail(order, toEmail).catch(console.error);
    if (status === 'cancelled')  sendMedicineCancelledEmail(order, toEmail).catch(console.error);

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Admin] Medicine order update error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
