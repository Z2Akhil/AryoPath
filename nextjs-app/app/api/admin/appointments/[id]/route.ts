import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import { adminOrStaffAuth } from '@/lib/auth';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { sendConsultConfirmedEmail, sendConsultCancelledEmail, sendConsultCompletedEmail, sendDoctorAppointmentCancelledEmail } from '@/lib/services/transactionalEmailService';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();

        const auth = await adminOrStaffAuth(req, PERMISSIONS.APPOINTMENTS_VIEW);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;
        const appointment = await ConsultationAppointment.findById(id).lean();

        if (!appointment) {
            return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, appointment });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch appointment' }, { status: 500 });
    }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
    pending:   ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();

        const auth = await adminOrStaffAuth(req, PERMISSIONS.APPOINTMENTS_VIEW);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { id } = await params;
        const { status } = await req.json();

        if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const appointment = await ConsultationAppointment.findById(id);
        if (!appointment) {
            return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
        }

        const allowed = VALID_TRANSITIONS[appointment.status] || [];
        if (!allowed.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Cannot move from "${appointment.status}" to "${status}"` },
                { status: 400 }
            );
        }

        appointment.status = status;
        await appointment.save();

        if (status === 'confirmed') sendConsultConfirmedEmail(appointment).catch(console.error);
        if (status === 'cancelled') { sendConsultCancelledEmail(appointment).catch(console.error); sendDoctorAppointmentCancelledEmail(appointment).catch(console.error); }
        if (status === 'completed') sendConsultCompletedEmail(appointment).catch(console.error);

        return NextResponse.json({ success: true, appointment });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 });
    }
}
