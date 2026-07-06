export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';

// Cron: clean up expired on-behalf payment-link bookings that were never paid.
// - Appointments have NO TTL, so this is the safety net that RELEASES held slots
//   if Cashfree's EXPIRED webhook never fires.
// - Medicine orders have a 48h TTL that deletes them, but we also mark any lingering
//   unpaid ones as payment_failed here (idempotent).
//
// Schedule every ~30 min. Vercel: vercel.json crons "0,30 * * * *".
// External: POST https://ayropath.com/api/cron/expire-onbehalf  Header: x-cron-secret: <CRON_SECRET>
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const incoming = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
    if (incoming !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await connectDB();
    const now = new Date();

    // ── Appointments: pending + unpaid + link expired → cancel (releases the held slot) ──
    const apptRes = await ConsultationAppointment.updateMany(
      {
        bookedByAdmin: true,
        status: 'pending',
        'payment.status': 'pending',
        'paymentLink.expiresAt': { $lt: now },
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: 'Payment link expired (unpaid)',
        },
      },
    );

    // ── Medicine orders: lingering unpaid on-behalf link orders → payment_failed ──
    const medRes = await MedicineOrder.updateMany(
      {
        bookedByAdmin: true,
        status: 'pending_payment',
        'payment.method': 'online',
        expiresAt: { $lt: now },
      } as any,
      { $set: { status: 'payment_failed' } },
    );

    const summary = {
      appointmentsCancelled: apptRes.modifiedCount ?? 0,
      medicineOrdersFailed:  medRes.modifiedCount ?? 0,
    };
    console.log('[Cron] expire-onbehalf:', JSON.stringify(summary));

    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('[Cron] expire-onbehalf error:', err);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}
