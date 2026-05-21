export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminContext } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const period = searchParams.get('period') || 'daily';
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);

        const hasCustomDateFilter = !!(startDateParam || endDateParam);

        const dateFilter = {
            $gte: startDateParam ? new Date(startDateParam) : defaultStartDate,
            $lte: endDateParam ? new Date(endDateParam) : defaultEndDate
        };

        const effectivePeriod = (!hasCustomDateFilter && period === 'daily') ? 'monthly' : period;

        let dateFormat;
        switch (effectivePeriod) {
            case 'daily':
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case 'weekly':
                dateFormat = { $dateToString: { format: '%Y-%W', date: '$createdAt' } };
                break;
            case 'monthly':
                dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            default:
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }

        const orderTrends = await Order.aggregate([
            { $match: { createdAt: dateFilter } },
            { $group: { _id: dateFormat, date: { $first: '$createdAt' }, orderCount: { $sum: 1 }, revenue: { $sum: '$package.price' } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', orderCount: 1, revenue: 1 } }
        ]);

        const userTrends = await User.aggregate([
            { $match: { createdAt: dateFilter } },
            { $group: { _id: dateFormat, date: { $first: '$createdAt' }, userCount: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', userCount: 1 } }
        ]);

        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) {
            await AdminActivity.logActivity({
                adminId,
                sessionId,
                action: 'ANALYTICS_TRENDS_FETCH',
                description: 'Fetched analytics trends',
                resource: 'analytics',
                endpoint: '/api/admin/analytics/trends',
                method: 'GET',
                ipAddress,
                userAgent,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { period, startDate: dateFilter.$gte, endDate: dateFilter.$lte }
            });
        }

        return NextResponse.json({ success: true, trends: { orderTrends, userTrends } });

    } catch (error: any) {
        console.error('Analytics trends fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics trends' }, { status: 500 });
    }
}
