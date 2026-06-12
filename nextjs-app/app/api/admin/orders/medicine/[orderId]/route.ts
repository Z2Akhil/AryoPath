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
  sendMedicineRefundInitiatedEmail,
} from '@/lib/services/transactionalEmailService';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';

const VALID_STATUSES: MedicineOrderStatus[] = [
  'pending_payment', 'payment_failed', 'confirmed',
  'prescription_required', 'prescription_verified',
  'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'refunded',
  'return_requested', 'return_received',
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
    if (notes !== undefined) order.notes = notes;
    if (cancellationReason !== undefined) order.cancellationReason = cancellationReason;
    if (status === 'cancelled' && !order.cancellationReason) order.cancellationReason = 'Cancelled by admin';

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

    // Use raw collection update to bypass Mongoose schema validation on cached model
    const $set: Record<string, any> = {};
    if (status) {
      $set.status = order.status;
      if ((order as any).deliveredAt) $set.deliveredAt = (order as any).deliveredAt;
      if ((order as any).cancelledAt) $set.cancelledAt = (order as any).cancelledAt;
    }
    if (notes !== undefined)              $set.notes = order.notes;
    if (cancellationReason !== undefined) $set.cancellationReason = order.cancellationReason;
    if (awb !== undefined) {
      $set.awb             = (order as any).awb;
      $set.courierPartner  = (order as any).courierPartner;
      $set.trackingUrl     = (order as any).trackingUrl;
      if ((order as any).courierStatus)        $set.courierStatus        = (order as any).courierStatus;
      if ((order as any).courierStatusHistory) $set.courierStatusHistory = (order as any).courierStatusHistory;
      if ((order as any).courierStatusUpdatedAt) $set.courierStatusUpdatedAt = (order as any).courierStatusUpdatedAt;
    }
    await MedicineOrder.collection.updateOne({ _id: order._id }, { $set });
    await order.populate('userId', 'firstName lastName mobileNumber email');

    const toEmail: string = order.shippingAddress?.email || (order.userId as any)?.email || '';
    if (status === 'confirmed') sendMedicineConfirmedEmail(order, toEmail).catch(console.error);
    if (status === 'shipped')   sendMedicineShippedEmail(order, toEmail).catch(console.error);
    if (status === 'delivered') sendMedicineDeliveredEmail(order, toEmail).catch(console.error);

    if (status === 'cancelled') {
      sendMedicineCancelledEmail(order, toEmail).catch(console.error);

      // Auto-refund if paid online and no refund already in progress
      const payment = order.payment as any;
      if (payment?.status === 'paid' && payment?.cfOrderId && !payment?.refundId) {
        const { refundId, status: refundStatus } = await initiateRefund(
          payment.cfOrderId,
          order.grandTotal,
          `Admin cancelled order: ${order.cancellationReason || 'No reason'}`
        );
        const refundOk = refundStatus !== 'failed';
        await MedicineOrder.collection.updateOne(
          { _id: order._id },
          { $set: {
            ...(refundOk ? { status: 'refunded', 'payment.status': 'refunded' } : {}),
            'payment.refundId':          refundId,
            'payment.refundAmount':      order.grandTotal,
            'payment.refundStatus':      refundOk ? 'initiated' : 'failed',
            'payment.refundInitiatedAt': new Date(),
          }}
        );
        if (refundOk) {
          // Update local order object so returned JSON reflects refunded status
          (order as any).status = 'refunded';
          (payment).status = 'refunded';
          sendMedicineRefundInitiatedEmail(order, toEmail).catch(console.error);
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('[Admin] Medicine order update error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
