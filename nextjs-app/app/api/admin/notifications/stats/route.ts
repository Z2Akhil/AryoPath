export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/models/Notification';

export async function GET(req: NextRequest) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.NOTIFICATIONS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        // Aggregate stats from the Notification model
        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: null,
                    // Use max to ensure totalSent is at least sum of outcomes
                    unfilteredTotalSent: { $sum: '$recipientCount' },
                    actualOutcomes: { $sum: { $add: ['$deliveredCount', '$failedCount'] } },
                    totalDelivered: { $sum: '$deliveredCount' },
                    totalFailed: { $sum: '$failedCount' },
                    totalNotifications: { $sum: 1 }
                }
            },
            {
                $project: {
                    totalSent: { $max: ['$unfilteredTotalSent', '$actualOutcomes'] },
                    totalDelivered: 1,
                    totalFailed: 1,
                    totalPending: {
                        $max: [0, { $subtract: ['$unfilteredTotalSent', '$actualOutcomes'] }]
                    },
                    totalNotifications: 1
                }
            }
        ]);

        const result = stats[0] || {
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            totalPending: 0,
            totalNotifications: 0
        };

        const successRate = result.totalSent > 0
            ? ((result.totalDelivered / result.totalSent) * 100).toFixed(1)
            : '0';

        // Get monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await Notification.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: '$recipientCount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                totalSent: result.totalSent,
                delivered: result.totalDelivered,
                failed: result.totalFailed,
                pending: result.totalPending,
                successRate,
                totalCampaigns: result.totalNotifications,
                monthlyTrend: monthlyTrend.map(t => ({
                    month: t._id,
                    count: t.count
                }))
            }
        });

    } catch (error: any) {
        console.error('Fetch Notification Stats Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notification stats' }, { status: 500 });
    }
}
