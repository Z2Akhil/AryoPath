import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';

const RETURN_WINDOW_DAYS = 7;

function getUserId(req: NextRequest): string | null {
  const token = req.headers.get('authorization')?.replace('Bearer', '').trim();
  if (!token) return null;
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return d.id;
  } catch { return null; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { orderId } = await params;
  const { reason } = await req.json().catch(() => ({}));

  if (!reason?.trim())
    return NextResponse.json({ success: false, error: 'Return reason is required' }, { status: 400 });

  const order = await MedicineOrder.findOne({ orderId, userId });
  if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

  if (order.status !== 'delivered')
    return NextResponse.json({ success: false, error: 'Only delivered orders can be returned' }, { status: 400 });

  if ((order as any).returnRequest)
    return NextResponse.json({ success: false, error: 'Return request already submitted' }, { status: 400 });

  const deliveredAt = (order as any).deliveredAt;
  if (!deliveredAt)
    return NextResponse.json({ success: false, error: 'Delivery date not recorded' }, { status: 400 });

  const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN_WINDOW_DAYS)
    return NextResponse.json({
      success: false,
      error: `Return window closed. Returns accepted within ${RETURN_WINDOW_DAYS} days of delivery.`,
    }, { status: 400 });

  order.status = 'return_requested';
  (order as any).returnRequest = {
    requestedAt: new Date(),
    reason: reason.trim(),
    status: 'pending',
  };

  await order.save();

  return NextResponse.json({ success: true, message: 'Return request submitted. Our team will contact you within 24 hours.' });
}
