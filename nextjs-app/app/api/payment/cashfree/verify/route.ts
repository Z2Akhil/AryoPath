import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';

const CF_BASE = process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com'
    : 'https://sandbox.cashfree.com';

const CF_HEADERS = {
    'x-client-id':     process.env.CASHFREE_APP_ID || '',
    'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
    'x-api-version':   '2023-08-01',
};

const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        return await User.findById(decoded.id).select('_id isActive isVerified').lean();
    } catch { return null; }
};

async function verifyCashfreeOrder(cfOrderId: string): Promise<{ paid: boolean; cfPaymentId?: string }> {
    const res = await fetch(`${CF_BASE}/pg/orders/${cfOrderId}`, { headers: CF_HEADERS });
    if (!res.ok) return { paid: false };
    const data = await res.json();
    const paid = data.order_status === 'PAID';
    return { paid, cfPaymentId: data.cf_order_id ? String(data.cf_order_id) : undefined };
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
        const user = await getUserFromToken(token);

        if (!user || !(user as any).isActive) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { cfOrderId, medicineOrderId } = body;

        if (!cfOrderId || !medicineOrderId) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const { paid, cfPaymentId } = await verifyCashfreeOrder(cfOrderId);

        if (!paid) {
            await MedicineOrder.findByIdAndUpdate(medicineOrderId, {
                'payment.status': 'failed',
                status: 'payment_failed',
            });
            return NextResponse.json({ success: false, message: 'Payment not completed' }, { status: 400 });
        }

        const existingOrder = await MedicineOrder.findOne({
            _id: medicineOrderId,
            userId: (user as any)._id,
        }).lean();

        if (!existingOrder) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        const order = await MedicineOrder.findByIdAndUpdate(
            medicineOrderId,
            {
                'payment.cfOrderId':   cfOrderId,
                'payment.cfPaymentId': cfPaymentId || '',
                'payment.status':      'paid',
                'payment.paidAt':      new Date(),
                status: (existingOrder as any).requiresPrescription ? 'prescription_required' : 'confirmed',
            },
            { new: true }
        ).lean();

        return NextResponse.json({
            success: true,
            data: { orderId: (order as any).orderId, status: (order as any).status },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Payment verification failed';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
