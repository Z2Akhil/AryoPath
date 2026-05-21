import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';
import { trackShipment } from '@/lib/services/delhiveryService';

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

    const order = await MedicineOrder.findOne({ orderId, userId: (user as any)._id });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (!order.awb) {
      return NextResponse.json({
        success: true,
        data: { courierStatus: '', courierStatusHistory: [], courierStatusUpdatedAt: null },
      });
    }

    const result = await trackShipment(order.awb);
    if (result) {
      (order as any).courierStatus = result.latestStatus;
      (order as any).courierStatusHistory = result.events;
      (order as any).courierStatusUpdatedAt = new Date();
      (order as any).trackingUrl = result.trackingUrl;

      if (result.latestStatus.toLowerCase().includes('delivered') && order.status !== 'delivered') {
        order.status = 'delivered';
        (order as any).deliveredAt = new Date();
      }

      await order.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        courierStatus: (order as any).courierStatus ?? '',
        courierStatusHistory: (order as any).courierStatusHistory ?? [],
        courierStatusUpdatedAt: (order as any).courierStatusUpdatedAt ?? null,
        trackingUrl: (order as any).trackingUrl ?? '',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tracking';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
