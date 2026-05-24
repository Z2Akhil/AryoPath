import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import { adminOrStaffAuth } from '@/lib/auth';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { PERMISSIONS } from '@/lib/constants/permissions';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await adminOrStaffAuth(req, PERMISSIONS.APPOINTMENTS_VIEW);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const { searchParams } = new URL(req.url);
        const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
        const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'));
        const status   = searchParams.get('status')   || '';
        const doctorId = searchParams.get('doctorId') || '';
        const search   = searchParams.get('search')   || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate   = searchParams.get('endDate')   || '';

        const filter: Record<string, any> = {};

        if (status) filter.status = status;
        if (doctorId) filter.doctorId = doctorId;

        if (startDate || endDate) {
            filter.appointmentDateTime = {};
            if (startDate) filter.appointmentDateTime.$gte = new Date(startDate);
            if (endDate)   filter.appointmentDateTime.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        if (search) {
            const s = search.trim();
            filter.$or = [
                { patientName:   { $regex: s, $options: 'i' } },
                { patientMobile: { $regex: s, $options: 'i' } },
                { doctorName:    { $regex: s, $options: 'i' } },
            ];
        }

        const skip  = (page - 1) * limit;
        const total = await ConsultationAppointment.countDocuments(filter);

        const appointments = await ConsultationAppointment.find(filter)
            .sort({ appointmentDateTime: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            appointments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch appointments' }, { status: 500 });
    }
}
