export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, PERMISSIONS.ORDERS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { orderId } = await params;

        const order = await Order.findOne({ orderId })
            .populate('userId', 'firstName lastName email mobileNumber')
            .populate('adminId', 'name email mobile')
            .lean();

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) {
            await AdminActivity.logActivity({
                adminId,
                sessionId,
                action: 'ORDER_DETAILS_FETCH',
                description: `Fetched order details for ${orderId}`,
                resource: 'orders',
                endpoint: `/api/admin/orders/${orderId}`,
                method: 'GET',
                ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
                userAgent: req.headers.get('user-agent') || 'unknown',
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { orderId }
            });
        }

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error('Order details fetch error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch order details' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, PERMISSIONS.ORDERS_EDIT);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { orderId } = await params;
        const updates = await req.json();

        const order = await Order.findOne({ orderId });

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        if (updates.thyrocareStatus) {
            await (order as any).updateThyrocareStatus(updates.thyrocareStatus, updates.notes || 'Updated by admin');
        }

        if (updates.status) {
            order.status = updates.status;
        }

        if (updates.notes) {
            order.notes = updates.notes;
        }

        await order.save();

        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) {
            await AdminActivity.logActivity({
                adminId,
                sessionId,
                action: 'ORDER_UPDATE',
                description: `Updated order ${orderId}`,
                resource: 'orders',
                endpoint: `/api/admin/orders/${orderId}`,
                method: 'PUT',
                ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
                userAgent: req.headers.get('user-agent') || 'unknown',
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: {
                    orderId,
                    updates: Object.keys(updates),
                    status: order.status,
                    thyrocareStatus: order.thyrocare.status
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Order updated successfully',
            order
        });

    } catch (error: any) {
        console.error('Order update error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to update order' }, { status: 500 });
    }
}
