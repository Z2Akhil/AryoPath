import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import { adminOrStaffAuth } from '@/lib/auth';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { PERMISSIONS } from '@/lib/constants/permissions';
import {
  sendConsultConfirmedEmail,
  sendConsultCancelledEmail,
  sendConsultCompletedEmail,
  sendDoctorAppointmentCancelledEmail,
  sendConsultRefundInitiatedEmail,
} from '@/lib/services/transactionalEmailService';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';

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
    no_show:   [],
    refunded:  [],
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

        const updateFields: Record<string, any> = { status };
        if (status === 'cancelled') updateFields.cancelledAt = new Date();

        await ConsultationAppointment.collection.updateOne(
            { _id: appointment._id },
            { $set: updateFields }
        );

        const updated = await ConsultationAppointment.findById(id).lean() as any;

        if (status === 'confirmed') sendConsultConfirmedEmail(updated).catch(console.error);
        if (status === 'completed') sendConsultCompletedEmail(updated).catch(console.error);

        if (status === 'cancelled') {
            sendConsultCancelledEmail(updated).catch(console.error);
            sendDoctorAppointmentCancelledEmail(updated).catch(console.error);

            // Auto-refund if paid online and no refund already in progress
            const payment = updated?.payment as any;
            if (payment?.status === 'paid' && payment?.cfOrderId && !payment?.refundId) {
                const { refundId, status: refundStatus } = await initiateRefund(
                    payment.cfOrderId,
                    updated.finalAmount,
                    'Admin cancelled consultation'
                );
                const refundOk = refundStatus !== 'failed';
                await ConsultationAppointment.collection.updateOne(
                    { _id: appointment._id },
                    { $set: {
                        ...(refundOk ? { status: 'refunded', 'payment.status': 'refunded' } : {}),
                        'payment.refundId':          refundId,
                        'payment.refundAmount':      updated.finalAmount,
                        'payment.refundStatus':      refundOk ? 'initiated' : 'failed',
                        'payment.refundInitiatedAt': new Date(),
                    }}
                );
                if (refundOk) {
                    updated.status = 'refunded';
                    sendConsultRefundInitiatedEmail(updated).catch(console.error);
                }
            }
        }

        return NextResponse.json({ success: true, appointment: updated });
    } catch (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json({ success: false, error: 'Failed to update appointment' }, { status: 500 });
    }
}
