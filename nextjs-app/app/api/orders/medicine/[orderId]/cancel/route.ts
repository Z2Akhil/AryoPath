import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';
import {
  getMedicineOrderEmail,
  sendMedicineCancelledEmail,
  sendMedicineRefundInitiatedEmail,
} from '@/lib/services/transactionalEmailService';

const CANCELLABLE_STATUSES = ['confirmed', 'prescription_required', 'prescription_verified'];

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

  if (!CANCELLABLE_STATUSES.includes(order.status))
    return NextResponse.json({
      success: false,
      error: 'Order cannot be cancelled at this stage. If shipped, you may request a return after delivery.',
    }, { status: 400 });

  // Atomically claim cancellation — prevents race condition on double-submit
  const claimed = await MedicineOrder.collection.findOneAndUpdate(
    { _id: order._id, status: { $in: CANCELLABLE_STATUSES } },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } }
  );
  if (!claimed) return NextResponse.json({ success: false, error: 'Order already processed' }, { status: 409 });

  let refundInitiated = false;
  const payment = (order.payment as any);
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

  getMedicineOrderEmail(order).then(email => sendMedicineCancelledEmail(order, email)).catch(console.error);

  return NextResponse.json({ success: true, refundInitiated });
}
