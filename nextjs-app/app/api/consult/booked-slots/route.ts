export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';

/**
 * GET /api/consult/booked-slots?doctorSlug=xxx&date=2026-06-05
 * Returns time slots already booked (non-cancelled) for a doctor on a given date.
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

        const appointments = await ConsultationAppointment.find({
            doctorSlug,
            appointmentDate: date,
            status: { $nin: ['cancelled'] },
        }).select('appointmentTime').lean();

        const bookedSlots = appointments.map((a: any) => a.appointmentTime);

        return NextResponse.json({ success: true, bookedSlots });
    } catch (err) {
        console.error('[booked-slots]', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch booked slots' }, { status: 500 });
    }
}
