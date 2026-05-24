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

        const now   = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalAll, totalToday, totalWeek, totalMonth, byStatus, upcoming, revenueAgg, topDoctors, modeAgg] =
            await Promise.all([
                ConsultationAppointment.countDocuments({}),
                ConsultationAppointment.countDocuments({ appointmentDateTime: { $gte: today } }),
                ConsultationAppointment.countDocuments({ appointmentDateTime: { $gte: weekStart } }),
                ConsultationAppointment.countDocuments({ appointmentDateTime: { $gte: monthStart } }),

                ConsultationAppointment.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),

                ConsultationAppointment.find({
                    appointmentDateTime: { $gte: now },
                    status: { $nin: ['cancelled', 'completed'] },
                })
                    .sort({ appointmentDateTime: 1 })
                    .limit(10)
                    .lean(),

                ConsultationAppointment.aggregate([
                    { $match: { 'payment.status': 'paid', appointmentDateTime: { $gte: monthStart } } },
                    { $group: { _id: null, total: { $sum: '$finalAmount' } } },
                ]),

                ConsultationAppointment.aggregate([
                    { $match: { appointmentDateTime: { $gte: monthStart } } },
                    { $group: { _id: '$doctorId', doctorName: { $first: '$doctorName' }, count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } },
                    { $sort: { count: -1 } },
                    { $limit: 5 },
                ]),

                ConsultationAppointment.aggregate([
                    { $group: { _id: '$consultationMode', count: { $sum: 1 } } },
                ]),
            ]);

        const statusMap = Object.fromEntries(byStatus.map((b: any) => [b._id, b.count]));

        return NextResponse.json({
            success: true,
            stats: {
                total:        totalAll,
                today:        totalToday,
                thisWeek:     totalWeek,
                thisMonth:    totalMonth,
                revenueMonth: revenueAgg[0]?.total || 0,
                byStatus: {
                    pending:   statusMap.pending   || 0,
                    confirmed: statusMap.confirmed  || 0,
                    completed: statusMap.completed  || 0,
                    cancelled: statusMap.cancelled  || 0,
                },
                upcoming,
                topDoctors,
                byMode: Object.fromEntries(modeAgg.map((m: any) => [m._id, m.count])),
            },
        });
    } catch (error) {
        console.error('Error fetching appointment stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
