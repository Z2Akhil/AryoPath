import { NextRequest, NextResponse } from 'next/server';
import { doctorAuth } from '@/lib/auth';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import connectToDatabase from '@/lib/db/mongoose';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    const authResult = await doctorAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const appointment = await ConsultationAppointment.findById(id).lean();

    if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.doctorId.toString() !== authResult.doctor._id.toString()) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, appointment });
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const authResult = await doctorAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const ALLOWED_STATUSES = ['confirmed', 'completed', 'cancelled'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid status. Allowed: confirmed, completed, cancelled' }, { status: 400 });
    }

    const appointment = await ConsultationAppointment.findById(id);
    if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.doctorId.toString() !== authResult.doctor._id.toString()) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    appointment.status = status;
    await appointment.save();

    return NextResponse.json({ success: true, appointment });
}
