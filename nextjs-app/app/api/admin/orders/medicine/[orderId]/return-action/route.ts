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

  if (!['approve', 'reject', 'received'].includes(action))
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  const order = await MedicineOrder.findOne({ orderId });
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

  if (!['return_requested'].includes(order.status) && action !== 'received')
    return NextResponse.json({ success: false, error: 'Order is not in return_requested state' }, { status: 400 });

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
      await MedicineOrder.collection.updateOne(
        { _id: order._id },
        { $set: {
          'returnRequest.status':      'received',
          'returnRequest.receivedAt':  new Date(),
          status:                      'refunded',
          'payment.status':            'refunded',
          'payment.refundId':          refundId,
          'payment.refundAmount':      order.grandTotal,
          'payment.refundStatus':      status === 'failed' ? 'failed' : 'initiated',
          'payment.refundInitiatedAt': new Date(),
        }}
      );
      getMedicineOrderEmail(order).then(email => sendMedicineRefundInitiatedEmail(order, email)).catch(console.error);
    } else {
      await order.save();
    }
    // early return to avoid double save below
    await order.populate('userId', 'firstName lastName mobileNumber email');
    return NextResponse.json({ success: true, order });
  }

  await order.save();
  await order.populate('userId', 'firstName lastName mobileNumber email');

  return NextResponse.json({ success: true, order });
}
