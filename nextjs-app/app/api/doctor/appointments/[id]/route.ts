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
    const { status, prescription } = body;

    const appointment = await ConsultationAppointment.findById(id);
    if (!appointment) {
        return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.doctorId.toString() !== authResult.doctor._id.toString()) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (status !== undefined) {
        const ALLOWED_STATUSES = ['confirmed', 'completed', 'cancelled'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }
        appointment.status = status;
    }

    if (prescription !== undefined) {
        if (!prescription.medicines || !Array.isArray(prescription.medicines)) {
            return NextResponse.json({ success: false, error: 'Invalid prescription' }, { status: 400 });
        }
        appointment.set('prescription', {
            medicines: prescription.medicines.map((m: any) => ({
                name:         String(m.name || '').trim(),
                dose:         String(m.dose || '').trim(),
                frequency:    String(m.frequency || '').trim(),
                duration:     String(m.duration || '').trim(),
                instructions: String(m.instructions || '').trim(),
            })),
            notes:    String(prescription.notes || '').trim(),
            issuedAt: new Date(),
        });
        appointment.markModified('prescription');
    }

    await appointment.save();
    const updated = await ConsultationAppointment.findById(id).lean();
    return NextResponse.json({ success: true, appointment: updated });
}
