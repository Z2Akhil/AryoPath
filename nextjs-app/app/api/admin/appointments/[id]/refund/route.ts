export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.APPOINTMENTS_EDIT);
  if (!auth.authenticated)
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  await connectDB();
  const { id } = await params;

  const appt = await ConsultationAppointment.findById(id);
  if (!appt) return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });

  if (appt.status !== 'cancelled')
    return NextResponse.json({ success: false, error: 'Refund only applicable for cancelled appointments' }, { status: 400 });

  if (appt.payment?.status !== 'paid')
    return NextResponse.json({ success: false, error: 'No payment to refund' }, { status: 400 });

  // Guard undefined refundStatus (old docs) + already initiated
  const rs = (appt.payment as any).refundStatus;
  if (rs && rs !== 'none')
    return NextResponse.json({ success: false, error: 'Refund already initiated' }, { status: 400 });
  if ((appt.payment as any).refundId)
    return NextResponse.json({ success: false, error: 'Refund already initiated' }, { status: 400 });

  const { refundId, status, error } = await initiateRefund(
    appt.payment.cfOrderId,
    appt.finalAmount,
    'Admin initiated refund for cancelled consultation'
  );
  await ConsultationAppointment.collection.updateOne(
    { _id: appt._id },
    { $set: {
      'payment.refundId':          refundId,
      'payment.refundAmount':      appt.finalAmount,
      'payment.refundStatus':      status === 'failed' ? 'failed' : 'initiated',
      'payment.refundInitiatedAt': new Date(),
    }}
  );

  return NextResponse.json({
    success: status !== 'failed',
    refundId,
    refundStatus: status,
    error,
  });
}
