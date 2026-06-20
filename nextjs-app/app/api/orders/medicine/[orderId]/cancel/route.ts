import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';
import { cancelShipment, cancelPickup } from '@/lib/services/delhiveryService';
import {
  getMedicineOrderEmail,
  sendMedicineCancelledEmail,
  sendMedicineRefundInitiatedEmail,
} from '@/lib/services/transactionalEmailService';

// Pre-shipment statuses — always cancellable.
const PRE_SHIP_STATUSES = ['confirmed', 'prescription_required', 'prescription_verified'];

// A shipped order is still cancellable ONLY while Delhivery hasn't picked it up yet.
// Delhivery reports its own courier status; '' (just created) or 'Manifested' = not picked.
function isNotYetPicked(courierStatus?: string): boolean {
  const s = (courierStatus ?? '').toLowerCase().trim();
  return s === '' || s === 'manifested';
}

function getUserId(req: NextRequest): string | null {
  const token = req.headers.get('authorization')?.replace('Bearer', '').trim();
  if (!token) return null;
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return d.id;
  } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { orderId } = await params;
  const { reason = 'Cancelled by user' } = await req.json().catch(() => ({}));

  const order = await MedicineOrder.findOne({ orderId, userId });
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

  const courierStatus = (order as any).courierStatus as string | undefined;
  const awb           = (order as any).awb as string | undefined;

  const isPreShip          = PRE_SHIP_STATUSES.includes(order.status);
  const isShippedCancelable = order.status === 'shipped' && isNotYetPicked(courierStatus);

  if (!isPreShip && !isShippedCancelable)
    return NextResponse.json({
      success: false,
      error: 'Order cannot be cancelled at this stage. If shipped, you may request a return after delivery.',
    }, { status: 400 });

  // ── For a shipped order with a real AWB, cancel the Delhivery shipment FIRST.
  // If Delhivery can't cancel (already picked up), abort BEFORE touching status/refund.
  if (order.status === 'shipped' && awb) {
    const cancelRes = await cancelShipment(awb);
    if (!cancelRes.success) {
      console.warn(`[Cancel] Delhivery cancel failed for AWB ${awb}: ${cancelRes.error}`);
      return NextResponse.json({
        success: false,
        error: 'This order has already been picked up by the courier and can no longer be cancelled. You can return it after delivery.',
      }, { status: 409 });
    }

    // Also cancel the scheduled pickup slot if one was booked
    const pickupId = (order as any).pickupId as string | undefined;
    if (pickupId) {
      const pickupCancelRes = await cancelPickup(pickupId);
      if (!pickupCancelRes.success) {
        // Non-fatal — log the warning but don't block the order cancellation
        console.warn(`[Cancel] Delhivery pickup cancel failed for pickupId ${pickupId}: ${pickupCancelRes.error}`);
      } else {
        console.log(`[Cancel] Delhivery pickup ${pickupId} cancelled successfully`);
      }
    }
  }

  // ── Atomically claim cancellation — prevents race (double-submit / webhook flipping status).
  // Filter matches exactly the condition that made the order cancellable above.
  const claimFilter: any = { _id: order._id };
  if (isPreShip) {
    claimFilter.status = { $in: PRE_SHIP_STATUSES };
  } else {
    claimFilter.status = 'shipped';
    claimFilter.$or = [
      { courierStatus: { $in: ['', null] } },
      { courierStatus: { $regex: /^manifested$/i } },
    ];
  }

  const claimed = await MedicineOrder.collection.findOneAndUpdate(
    claimFilter,
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } }
  );
  if (!claimed) return NextResponse.json({ success: false, error: 'Order already processed' }, { status: 409 });

  // ── Refund (unchanged logic) — only for paid online orders.
  let refundInitiated = false;
  const payment  = (order.payment as any);
  const isPaid   = payment?.status === 'paid' && payment?.cfOrderId;
  const noRefund = payment?.refundId && payment?.refundStatus !== 'failed'; // allow retry on failed refunds

  if (isPaid && !noRefund) {
    const { refundId, status } = await initiateRefund(
      payment.cfOrderId,
      order.grandTotal,
      'User cancelled medicine order'
    );
    const refundOk = status !== 'failed';
    await MedicineOrder.collection.updateOne(
      { _id: order._id },
      { $set: {
        // Move to refunded immediately once refund is initiated
        ...(refundOk ? { status: 'refunded', 'payment.status': 'refunded' } : {}),
        'payment.refundId':          refundId,
        'payment.refundAmount':      order.grandTotal,
        'payment.refundStatus':      refundOk ? 'initiated' : 'failed',
        'payment.refundInitiatedAt': new Date(),
      }}
    );
    refundInitiated = refundOk;

    if (refundOk) {
      getMedicineOrderEmail(order).then(email => sendMedicineRefundInitiatedEmail(order, email)).catch(console.error);
    }
  }

  // Stamp reason on in-memory order so email template uses it (DB already updated above)
  (order as any).cancellationReason = reason;
  getMedicineOrderEmail(order).then(email => sendMedicineCancelledEmail(order, email)).catch(console.error);

  return NextResponse.json({ success: true, refundInitiated });
}
