import { NextRequest, NextResponse } from 'next/server';
import { doctorAuth } from '@/lib/auth';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import connectToDatabase from '@/lib/db/mongoose';

export async function GET(req: NextRequest) {
    const authResult = await doctorAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')   || '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit')  || '20'));
    const status = searchParams.get('status');
    const date   = searchParams.get('date');
    const skip   = (page - 1) * limit;

    const query: Record<string, unknown> = { doctorId: authResult.doctor._id };
    if (status) query.status = status;
    if (date)   query.appointmentDate = date;

    const [appointments, total] = await Promise.all([
        ConsultationAppointment.find(query)
            .sort({ appointmentDateTime: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ConsultationAppointment.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, appointments, total, page, limit });
}
