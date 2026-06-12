export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';
import {
  getMedicineOrderEmail,
  sendMedicineRefundInitiatedEmail,
  sendMedicineReturnApprovedEmail,
} from '@/lib/services/transactionalEmailService';
import { scheduleReversePickup } from '@/lib/services/delhiveryService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.MED_ORDERS_EDIT);
  if (!auth.authenticated)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  await connectDB();
  const { orderId } = await params;
  const { action, adminNotes = '' } = await req.json();

  console.log(`[return-action] orderId=${orderId} action=${action}`);

  if (!['approve', 'reject', 'received', 'mark_refunded'].includes(action))
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  const order = await MedicineOrder.findOne({ orderId });
  console.log(`[return-action] found=${!!order} status=${order?.status}`);

  if (!order) return NextResponse.json({ success: false, error: 'Order not found', orderId }, { status: 404 });

  if (!['return_requested'].includes(order.status) && !['received', 'mark_refunded'].includes(action))
    return NextResponse.json({ success: false, error: `Order status is '${order.status}', expected return_requested` }, { status: 400 });

  const ret = (order as any).returnRequest;
  if (!ret) return NextResponse.json({ success: false, error: 'No return request found' }, { status: 400 });

  if (action === 'approve') {
    ret.status = 'approved';
    ret.approvedAt = new Date();
    if (adminNotes) ret.adminNotes = adminNotes;
    order.markModified('returnRequest');

    // Schedule reverse pickup with Delhivery (fire async — don't block response)
    const pickupResult = await scheduleReversePickup({
      orderId: order.orderId,
      awb: (order as any).awb ?? '',
      shippingAddress: order.shippingAddress as any,
      grandTotal: order.grandTotal,
    });

    if (pickupResult.success && pickupResult.returnAwb) {
      (order as any).returnAwb = pickupResult.returnAwb;
      console.log(`[Return] Reverse pickup scheduled. AWB: ${pickupResult.returnAwb}`);
    } else {
      console.warn(`[Return] Delhivery reverse pickup failed: ${pickupResult.error}. Approve continues — schedule manually.`);
    }

    // Email user with pickup confirmation
    getMedicineOrderEmail(order).then(email =>
      sendMedicineReturnApprovedEmail(order, email, pickupResult.returnAwb || undefined)
    ).catch(console.error);
  }

  if (action === 'reject') {
    ret.status = 'rejected';
    if (adminNotes) ret.adminNotes = adminNotes;
    order.status = 'delivered';
    order.markModified('returnRequest');
  }

  if (action === 'received') {
    ret.status = 'received';
    ret.receivedAt = new Date();
    if (adminNotes) ret.adminNotes = adminNotes;
    order.status = 'return_received';
    order.markModified('returnRequest');

    // Initiate refund if paid online and no refund already in progress
    const payment = order.payment as any;
    if (payment?.status === 'paid' && payment?.cfOrderId && !payment?.refundId) {
      const { refundId, status } = await initiateRefund(
        payment.cfOrderId,
        order.grandTotal,
        'Return received — full refund'
      );
      const onlineReceived = await MedicineOrder.findOneAndUpdate(
        { orderId },
        { $set: {
          'returnRequest.status':      'received',
          'returnRequest.receivedAt':  new Date(),
          status:                      'refunded',
          'payment.status':            'refunded',
          'payment.refundId':          refundId,
          'payment.refundAmount':      order.grandTotal,
          'payment.refundStatus':      status === 'failed' ? 'failed' : 'initiated',
          'payment.refundInitiatedAt': new Date(),
        }},
        { new: true }
      ).populate('userId', 'firstName lastName mobileNumber email').lean();
      getMedicineOrderEmail(order).then(email => sendMedicineRefundInitiatedEmail(order, email)).catch(console.error);
      return NextResponse.json({ success: true, order: onlineReceived });
    } else {
      const receivedOrder = await MedicineOrder.findOneAndUpdate(
        { orderId },
        { $set: {
          status: 'return_received',
          'returnRequest.status':     'received',
          'returnRequest.receivedAt': new Date(),
          ...(adminNotes ? { 'returnRequest.adminNotes': adminNotes } : {}),
        }},
        { new: true }
      ).populate('userId', 'firstName lastName mobileNumber email').lean();
      return NextResponse.json({ success: true, order: receivedOrder });
    }
  }

  // COD return: admin manually transferred money → mark as refunded
  if (action === 'mark_refunded') {
    const payment = order.payment as any;
    if (payment?.method !== 'cod' && payment?.status !== 'cod_pending')
      return NextResponse.json({ success: false, error: 'mark_refunded is only for COD orders' }, { status: 400 });
    if (!['return_requested', 'return_received'].includes(order.status))
      return NextResponse.json({ success: false, error: 'Order is not in a returnable state' }, { status: 400 });

    const updated = await MedicineOrder.findOneAndUpdate(
      { orderId },
      { $set: {
        status:                       'refunded',
        'returnRequest.status':       'refund_sent',
        'returnRequest.refundSentAt': new Date(),
        'returnRequest.receivedAt':   (order as any).returnRequest?.receivedAt ?? new Date(),
        ...(adminNotes ? { 'returnRequest.adminNotes': adminNotes } : {}),
      }},
      { new: true }
    ).populate('userId', 'firstName lastName mobileNumber email').lean();

    console.log(`[mark_refunded] orderId=${orderId} updated.status=${(updated as any)?.status}`);

    getMedicineOrderEmail(order).then(email => sendMedicineRefundInitiatedEmail(order, email)).catch(console.error);
    return NextResponse.json({ success: true, order: updated });
  }

  await order.save();
  await order.populate('userId', 'firstName lastName mobileNumber email');

  return NextResponse.json({ success: true, order });
}
