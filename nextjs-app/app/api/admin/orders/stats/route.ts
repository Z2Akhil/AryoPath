export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, PERMISSIONS.LAB_ORDERS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const [
            totalOrders,
            pendingOrders,
            createdOrders,
            failedOrders,
            completedOrders,
            cancelledOrders,
            categorizedStats,
            yetToAssign,
            assigned,
            accepted,
            serviced,
            done,
            thyrocareFailed
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'PENDING' }),
            Order.countDocuments({ status: 'CREATED' }),
            Order.countDocuments({ status: 'FAILED' }),
            Order.countDocuments({ status: 'COMPLETED' }),
            Order.countDocuments({ status: 'CANCELLED' }),
            Order.getCategorizedStats(),
            Order.countDocuments({ 'thyrocare.status': 'YET TO ASSIGN' }),
            Order.countDocuments({ 'thyrocare.status': 'ASSIGNED' }),
            Order.countDocuments({ 'thyrocare.status': 'ACCEPTED' }),
            Order.countDocuments({ 'thyrocare.status': 'SERVICED' }),
            Order.countDocuments({ 'thyrocare.status': 'DONE' }),
            Order.countDocuments({ 'thyrocare.status': 'FAILED' })
        ]);

        const thyrocareStatusCounts = {
            YET_TO_ASSIGN: yetToAssign,
            ASSIGNED: assigned,
            ACCEPTED: accepted,
            SERVICED: serviced,
            DONE: done,
            FAILED: thyrocareFailed
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysOrders = await Order.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const thisWeeksOrders = await Order.countDocuments({
            createdAt: { $gte: weekStart }
        });

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthsOrders = await Order.countDocuments({
            createdAt: { $gte: monthStart }
        });

        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) {
            await AdminActivity.logActivity({
                adminId,
                sessionId,
                action: 'ORDER_STATS_FETCH',
                description: 'Fetched order statistics',
                resource: 'orders',
                endpoint: '/api/admin/orders/stats',
                method: 'GET',
                ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
                userAgent: req.headers.get('user-agent') || 'unknown',
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { totalOrders, todaysOrders, thisWeeksOrders, thisMonthsOrders }
            });
        }

        return NextResponse.json({
            success: true,
            stats: {
                totalOrders,
                byStatus: {
                    PENDING: pendingOrders,
                    CREATED: createdOrders,
                    FAILED: failedOrders,
                    COMPLETED: completedOrders,
                    CANCELLED: cancelledOrders
                },
                byCategorizedStatus: categorizedStats,
                byThyrocareStatus: thyrocareStatusCounts,
                todaysOrders,
                thisWeeksOrders,
                thisMonthsOrders
            }
        });

    } catch (error: any) {
        console.error('Order stats fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch order statistics' }, { status: 500 });
    }
}
