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
    'Content-Type':    'application/json',
};

const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        return await User.findById(decoded.id).select('_id isActive isVerified email mobileNumber firstName lastName').lean();
    } catch { return null; }
};

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
        const user = await getUserFromToken(token);

        if (!user || !(user as any).isActive) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            return NextResponse.json({ success: false, message: 'Payment gateway not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { amount, currency = 'INR', orderRef, customerName, customerPhone, customerEmail } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
        }

        const userId = (user as any)._id.toString();
        const cfOrderId = `ayro_${orderRef || 'pay'}_${Date.now()}`;
        const phone = customerPhone || (user as any).mobileNumber || '9999999999';
        const email = customerEmail || (user as any).email || `user_${userId}@ayropath.in`;
        const name  = customerName || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Customer';

        const cfRes = await fetch(`${CF_BASE}/pg/orders`, {
            method: 'POST',
            headers: CF_HEADERS,
            body: JSON.stringify({
                order_id:       cfOrderId,
                order_amount:   parseFloat(amount.toFixed(2)),
                order_currency: currency,
                customer_details: {
                    customer_id:    `cust_${userId}`,
                    customer_name:  name,
                    customer_email: email,
                    customer_phone: String(phone).replace(/\D/g, '').slice(-10),
                },
            }),
        });

        const cfData = await cfRes.json();

        // Link the cfOrderId to the medicine order NOW (before payment) so the webhook can
        // confirm it server-side even if the browser never calls /verify (e.g. debit-card 3DS
        // redirect drops the return). Harmless no-op for non-medicine payments (e.g. consult).
        if (cfRes.ok && cfData.payment_session_id && orderRef) {
            await MedicineOrder.updateOne(
                { orderId: orderRef },
                { $set: { 'payment.cfOrderId': cfOrderId } }
            ).catch((e) => console.error('[cashfree/create] failed to link cfOrderId to order:', e));
        }

        if (!cfRes.ok || !cfData.payment_session_id) {
            console.error('[cashfree/create] Cashfree error:', {
                status: cfRes.status,
                env: process.env.CASHFREE_ENV,
                appId: process.env.CASHFREE_APP_ID?.slice(0, 8) + '...',
                response: cfData,
            });
            return NextResponse.json({ success: false, message: cfData.message || 'Failed to create payment order' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                cfOrderId:        cfData.order_id,
                paymentSessionId: cfData.payment_session_id,
                amount:           cfData.order_amount,
                currency:         cfData.order_currency,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create payment order';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
