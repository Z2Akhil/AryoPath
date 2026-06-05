export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { OrderStatusSyncService } from '@/lib/services/orderStatusSync';
import AdminActivity from '@/lib/models/AdminActivity';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { orderId } = await params;

        // Look up by human-readable orderId field, not MongoDB _id
        const Order = (await import('@/lib/models/Order')).default;
        const order = await Order.findOne({ orderId });
        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        const result: any = await OrderStatusSyncService.syncOrderStatus(order);

        // Log activity
        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ORDER_STATUS_SYNC',
            description: `Admin synced status for order ${orderId}`,
            resource: 'orders',
            endpoint: `/api/admin/orders/${orderId}/sync-status`,
            method: 'POST',
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
            userAgent: req.headers.get('user-agent') || 'unknown',
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                orderId,
                success: result.success,
                statusChanged: result.statusChanged,
                oldStatus: result.oldStatus || 'UNKNOWN',
                newStatus: result.newStatus || 'UNKNOWN'
            }
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Order status sync error:', error);
        return NextResponse.json({ success: false, error: 'Failed to sync order status' }, { status: 500 });
    }
}
