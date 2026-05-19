import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';

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

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid amount' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, message: 'Payment gateway not configured' }, { status: 500 });
    }

    // Dynamically import Razorpay to avoid issues if package isn't installed yet
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
