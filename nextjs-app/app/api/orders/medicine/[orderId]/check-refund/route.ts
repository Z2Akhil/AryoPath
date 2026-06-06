import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { getRefundStatus } from '@/lib/services/cashfreeRefundService';

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
  if (!userId) return NextResponse.json({ success: false }, { status: 401 });

  await connectDB();
  const { orderId } = await params;

  const order = await MedicineOrder.findOne({ orderId, userId });
  if (!order) return NextResponse.json({ success: false }, { status: 404 });

  const cfOrderId = (order.payment as any)?.cfOrderId;
  const refundId  = (order.payment as any)?.refundId;

  if (!cfOrderId || !refundId) return NextResponse.json({ success: true, refundStatus: 'none' });

  const status = await getRefundStatus(cfOrderId, refundId);
  const mapped = status === 'SUCCESS' ? 'processed' : status === 'CANCELLED' ? 'failed' : null;

  if (mapped && (order.payment as any).refundStatus !== mapped) {
    (order.payment as any).refundStatus = mapped;
    if (mapped === 'processed') (order.payment as any).refundCompletedAt = new Date();
    order.markModified('payment');
    await order.save();
  }

  return NextResponse.json({ success: true, refundStatus: mapped ?? (order.payment as any).refundStatus });
}
