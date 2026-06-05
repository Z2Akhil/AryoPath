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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const thyrocareStatus = searchParams.get('thyrocareStatus');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');

        const query: any = {};

        // Handle categorized status filter
        if (status) {
            if (status === 'COMPLETED') {
                query.$or = [
                    { status: 'COMPLETED' },
                    { 'thyrocare.status': 'DONE' }
                ];
            } else if (status === 'FAILED') {
                query.$or = [
                    { status: 'FAILED' },
                    { 'thyrocare.status': 'FAILED' }
                ];
            } else if (status === 'PENDING') {
                query.$and = [
                    { status: { $nin: ['COMPLETED', 'FAILED'] } },
                    { 'thyrocare.status': { $nin: ['DONE', 'FAILED'] } }
                ];
            } else {
                query.status = status;
            }
        }

        if (thyrocareStatus) {
            query['thyrocare.status'] = thyrocareStatus;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'contactInfo.email': { $regex: search, $options: 'i' } },
                { 'contactInfo.mobile': { $regex: search, $options: 'i' } },
                { 'package.name': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .populate('userId', 'firstName lastName email mobileNumber')
                .populate('adminId', 'name email mobile')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query)
        ]);

        // Log activity (admin only — staff has no adminId/session)
        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) await AdminActivity.logActivity({
            adminId,
            sessionId,
            action: 'ORDERS_FETCH',
            description: `Admin fetched orders list`,
            resource: 'orders',
            endpoint: '/api/admin/orders',
            method: 'GET',
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
            userAgent: req.headers.get('user-agent') || 'unknown',
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                page,
                limit,
                totalOrders,
                filters: { status, thyrocareStatus, startDate, endDate, search }
            }
        });

        return NextResponse.json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNextPage: skip + orders.length < totalOrders,
                hasPrevPage: page > 1
            }
        });

    } catch (error: any) {
        console.error('Orders fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}
