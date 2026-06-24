import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import connectToDatabase from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import AdminSession from '@/lib/models/AdminSession';
import User from '@/lib/models/User';
import { ThyrocareService } from '@/lib/services/thyrocare';

// Helper to get user from token
const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && user.isVerified) {
            return user;
        }
    } catch {
        // Invalid token
    }
    return null;
};

// Retry Thyrocare order creation via ThyrocareService
// (circuit breaker + rate-limit queue + auto-token-refresh)
const createThyrocareOrder = async (order: any) => {
    return await ThyrocareService.makeRequest(async (apiKey) => {
        const activeSession = await AdminSession.findOne({ isActive: true }).populate('adminId').lean();
        const refCode = (activeSession as any)?.adminId?.mobile || '';

        const payload = {
            api_key: apiKey,
            ref_order_id: order.orderId,
            email: order.contactInfo.email,
            mobile: order.contactInfo.mobile,
            address: `${order.contactInfo.address.street}, ${order.contactInfo.address.city}, ${order.contactInfo.address.state}`,
            appt_date: `${order.appointment.date} ${order.appointment.slot.split(' - ')[0]}`,
            order_by: (order.beneficiaries[0]?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '') || 'Customer',
            passon: order.package.discountAmount,
            pay_type: 'POSTPAID',
            pincode: order.contactInfo.address.pincode,
            products: Array.isArray(order.package.code) ? order.package.code.join(',') : order.package.code,
            ref_code: refCode,
            reports: order.reportsHardcopy,
            service_type: 'HOME',
            ben_data: order.beneficiaries.map((b: any) => ({
                name: b.name,
                age:  b.age,
                gender: b.gender === 'Male' ? 'M' : b.gender === 'Female' ? 'F' : 'O'
            })),
            coupon: '',
            order_mode: 'DSA-BOOKING-API',
            collection_type: 'Home Collection',
            source: 'Ayropath',
            phlebo_notes: ''
        };

        const response = await axios.post(
            'https://dx-dsa-service.thyrocare.com/api/booking-master/v2/create-order',
            payload,
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        if (response.data.response_status === 1) {
            return response.data;
        } else {
            const msg = response.data.response || 'Thyrocare order creation failed';
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    }).catch((error: any) => {
        const thyrocareMsg = error.response?.data?.response?.message || error.response?.data?.response || error.message;
        throw new Error(typeof thyrocareMsg === 'string' ? thyrocareMsg : JSON.stringify(thyrocareMsg));
    });
};

// GET /api/orders/[orderId] - Get order by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { orderId } = await params;

        const order = await Order.findOne({ orderId })
            .populate('userId adminId');

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if user has permission to view this order (only order owner)
        if (order.userId._id.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: order
        });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch order';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

// POST /api/orders/[orderId]/retry - Retry failed order
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { orderId } = await params;

        const order = await Order.findOne({ orderId })
            .populate('adminId');

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Check permissions (only order owner can retry)
        if (order.userId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Retry via ThyrocareService (circuit breaker + auto-refresh)
        try {
            const thyrocareResponse = await createThyrocareOrder(order);

            order.thyrocare.orderNo = thyrocareResponse.order_no;
            order.thyrocare.response = thyrocareResponse;
            order.thyrocare.error = undefined;
            order.thyrocare.retryCount += 1;
            order.thyrocare.lastRetryAt = new Date();
            order.status = 'CREATED';

            await order.save();

            return NextResponse.json({
                success: true,
                message: 'Order retried successfully',
                data: {
                    orderId: order.orderId,
                    thyrocareOrderNo: order.thyrocare.orderNo
                }
            });

        } catch (thyrocareError: any) {
            order.thyrocare.error = thyrocareError.message;
            order.thyrocare.retryCount += 1;
            order.thyrocare.lastRetryAt = new Date();
            await order.save();

            return NextResponse.json({
                success: false,
                message: 'Order retry failed',
                error: thyrocareError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error retrying order:', error);
        const message = error instanceof Error ? error.message : 'Failed to retry order';
        return NextResponse.json({ success: false, message, error: message }, { status: 500 });
    }
}
