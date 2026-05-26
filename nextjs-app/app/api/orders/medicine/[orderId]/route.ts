import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectToDatabase();
    const { orderId } = await params;

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const order = await MedicineOrder.findOne({
      orderId,
      userId: (user as any)._id,
    }).lean();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE — called when user cancels payment on the checkout modal
// Only works for pending_payment orders owned by the authenticated user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectToDatabase();
    const { orderId } = await params;

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await MedicineOrder.findOneAndDelete({
      orderId,
      userId: (user as any)._id,
      status: { $in: ['pending_payment', 'payment_failed'] },
    });

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Order not found or already confirmed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
