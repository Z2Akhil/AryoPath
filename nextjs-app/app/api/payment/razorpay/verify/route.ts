import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';

const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return await User.findById(decoded.id).select('_id isActive isVerified').lean();
  } catch {
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      medicineOrderId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !medicineOrderId) {
      return NextResponse.json({ success: false, message: 'Missing payment verification fields' }, { status: 400 });
    }

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ success: false, message: 'Payment gateway not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark order as payment_failed
      await MedicineOrder.findByIdAndUpdate(medicineOrderId, {
        'payment.status': 'failed',
        status: 'payment_failed',
      });
      return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 400 });
    }

    // Fetch order to determine next status
    const existingOrder = await MedicineOrder.findOne({ _id: medicineOrderId, userId: (user as any)._id }).lean();
    if (!existingOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Update order with payment details
    const order = await MedicineOrder.findByIdAndUpdate(
      medicineOrderId,
      {
        'payment.razorpayOrderId': razorpay_order_id,
        'payment.razorpayPaymentId': razorpay_payment_id,
        'payment.razorpaySignature': razorpay_signature,
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        status: existingOrder.requiresPrescription ? 'prescription_required' : 'confirmed',
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
