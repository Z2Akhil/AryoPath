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

    // Extract IP address and User-Agent for logging
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const { adminId: _actorId } = getAdminContext(auth);
        console.log('Fetching analytics overview', { startDate, endDate });

        // Date range filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }

        // Get order analytics
        const orderMatch: any = {};
        if (startDate || endDate) {
            orderMatch.createdAt = dateFilter;
        }

        const [
            totalOrders,
            totalRevenue,
            pendingOrders,
            createdOrders,
            completedOrders,
            failedOrders,
            cancelledOrders,
            totalUsers,
            newUsers
        ] = await Promise.all([
            // Order counts
            Order.countDocuments(orderMatch),
            Order.aggregate([
                { $match: orderMatch },
                { $group: { _id: null, total: { $sum: '$package.price' } } }
            ]).then(result => result[0]?.total || 0),
            Order.countDocuments({ ...orderMatch, status: 'PENDING' }),
            Order.countDocuments({ ...orderMatch, status: 'CREATED' }),
            Order.countDocuments({ ...orderMatch, status: 'COMPLETED' }),
            Order.countDocuments({ ...orderMatch, status: 'FAILED' }),
            Order.countDocuments({ ...orderMatch, status: 'CANCELLED' }),

            // User counts
            User.countDocuments(),
            User.countDocuments(startDate || endDate ? { createdAt: dateFilter } : {})
        ]);

        // Calculate conversion rate
        const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers * 100).toFixed(1) : '0';

        // Get Thyrocare status counts
        const thyrocareStatusCounts = {
            YET_TO_ASSIGN: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'YET TO ASSIGN' }),
            ASSIGNED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'ASSIGNED' }),
            ACCEPTED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'ACCEPTED' }),
            SERVICED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'SERVICED' }),
            DONE: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'DONE' }),
            FAILED: await Order.countDocuments({ ...orderMatch, 'thyrocare.status': 'FAILED' })
        };

        // Calculate average order value
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0';

        const { adminId: actorId, sessionId: actorSessionId } = getAdminContext(auth);
        await AdminActivity.logActivity({
            adminId: actorId,
            sessionId: actorSessionId,
            action: 'ANALYTICS_FETCH',
            description: `Fetched analytics overview`,
            resource: 'analytics',
            endpoint: '/api/admin/analytics/overview',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                startDate,
                endDate,
                totalOrders,
                totalRevenue
            }
        });

        return NextResponse.json({
            success: true,
            overview: {
                metrics: {
                    totalOrders,
                    totalRevenue,
                    avgOrderValue: parseFloat(avgOrderValue),
                    totalUsers,
                    newUsers,
                    conversionRate: parseFloat(conversionRate),
                    activeUsers: totalOrders > 0 ? totalOrders : 0 // Simplified active users
                },
                orderStatus: {
                    PENDING: pendingOrders,
                    CREATED: createdOrders,
                    COMPLETED: completedOrders,
                    FAILED: failedOrders,
                    CANCELLED: cancelledOrders
                },
                thyrocareStatus: thyrocareStatusCounts
            }
        });

    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('Analytics overview fetch error:', error);

        const { adminId: errActorId, sessionId: errSessionId } = getAdminContext(auth);
        await AdminActivity.logActivity({
            adminId: errActorId,
            sessionId: errSessionId,
            action: 'ERROR',
            description: `Failed to fetch analytics overview: ${error.message}`,
            resource: 'analytics',
            endpoint: '/api/admin/analytics/overview',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message
        });

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch analytics overview'
        }, { status: 500 });
    }
}
