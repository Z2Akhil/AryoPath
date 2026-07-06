export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import PendingConsultBooking from '@/lib/models/PendingConsultBooking';

/**
 * GET /api/consult/booked-slots?doctorSlug=xxx&date=2026-06-05
 * Returns time slots that are unavailable for a doctor on a given date — either a
 * confirmed/pending appointment OR an active (unexpired) on-behalf payment hold.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get('doctorSlug');
    const date = searchParams.get('date');

    if (!doctorSlug || !date) {
        return NextResponse.json({ success: false, error: 'doctorSlug and date required' }, { status: 400 });
    }

    try {
        await connectDB();

        const [appointments, holds] = await Promise.all([
            ConsultationAppointment.find({
                doctorSlug,
                appointmentDate: date,
                status: { $nin: ['cancelled'] },
            }).select('appointmentTime').lean(),
            PendingConsultBooking.find({
                doctorSlug,
                appointmentDate: date,
                expiresAt: { $gt: new Date() },
            }).select('appointmentTime').lean(),
        ]);

        const bookedSlots = [
            ...appointments.map((a: any) => a.appointmentTime),
            ...holds.map((h: any) => h.appointmentTime),
        ];

        return NextResponse.json({ success: true, bookedSlots: Array.from(new Set(bookedSlots)) });
    } catch (err) {
        console.error('[booked-slots]', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch booked slots' }, { status: 500 });
    }
}
