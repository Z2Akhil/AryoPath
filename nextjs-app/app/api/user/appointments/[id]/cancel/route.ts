import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';
import {
  sendConsultCancelledEmail,
  sendDoctorAppointmentCancelledEmail,
  sendConsultRefundInitiatedEmail,
} from '@/lib/services/transactionalEmailService';

const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

function getUserId(req: NextRequest): string | null {
  const token = req.headers.get('authorization')?.replace('Bearer', '').trim();
  if (!token) return null;
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return d.id;
  } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const { reason = 'Cancelled by user' } = await req.json().catch(() => ({}));

  const appt = await ConsultationAppointment.findById(id);
  if (!appt) return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });

  if (appt.userId?.toString() !== userId)
    return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });

  if (!['pending', 'confirmed'].includes(appt.status))
    return NextResponse.json({ success: false, error: 'Appointment cannot be cancelled at this stage' }, { status: 400 });

  const msUntilAppt = appt.appointmentDateTime.getTime() - Date.now();
  const slotEnded   = msUntilAppt < -30 * 60 * 1000;

  // Confirmed + slot ended = no-show, no refund
  if (slotEnded && appt.status === 'confirmed')
    return NextResponse.json({ success: false, error: 'Appointment has expired. No refund for confirmed no-shows.' }, { status: 400 });

  // Pending + slot ended = allow cancel with refund (doctor never confirmed)
  if (!slotEnded && msUntilAppt < CANCEL_WINDOW_MS)
    return NextResponse.json({
      success: false,
      error: 'Cannot cancel within 2 hours of appointment time',
    }, { status: 400 });

  // Atomically claim — prevents double-cancel and race with no_show worker
  const claimed = await ConsultationAppointment.collection.findOneAndUpdate(
    { _id: appt._id, status: { $in: ['pending', 'confirmed'] } },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason } }
  );
  if (!claimed) return NextResponse.json({ success: false, error: 'Appointment already processed' }, { status: 409 });

  let refundInitiated = false;
  const payment  = appt.payment as any;
  const isPaid   = payment?.status === 'paid' && payment?.cfOrderId;
  const noRefund = payment?.refundId;

  if (isPaid && !noRefund) {
    const { refundId, status } = await initiateRefund(
      payment.cfOrderId,
      appt.finalAmount,
      'User cancelled consultation'
    );
    const refundOk = status !== 'failed';
    await ConsultationAppointment.collection.updateOne(
      { _id: appt._id },
      { $set: {
        ...(refundOk ? { status: 'refunded', 'payment.status': 'refunded' } : {}),
        'payment.refundId':          refundId,
        'payment.refundAmount':      appt.finalAmount,
        'payment.refundStatus':      refundOk ? 'initiated' : 'failed',
        'payment.refundInitiatedAt': new Date(),
      }}
    );
    refundInitiated = refundOk;
    if (refundOk) sendConsultRefundInitiatedEmail(appt).catch(console.error);
  }

  sendConsultCancelledEmail(appt).catch(console.error);
  sendDoctorAppointmentCancelledEmail(appt).catch(console.error);

  return NextResponse.json({ success: true, refundInitiated });
}
