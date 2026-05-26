export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';

export async function GET(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.MED_ORDERS_VIEW);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page      = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit     = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const status    = searchParams.get('status');
    const search    = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate   = searchParams.get('endDate');

    // Never show unpaid ghost orders to admin unless explicitly filtered for
    const query: any = {
      status: { $nin: ['pending_payment', 'payment_failed'] },
    };

    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const skip = (page - 1) * limit;

    let orders: any;
    let total: number;

    if (search) {
      // Text search — find users matching name/mobile first, then also search orderId
      const User = (await import('@/lib/models/User')).default;
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName:  { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();

      const userIds = matchingUsers.map((u: any) => u._id);

      const searchQuery = {
        ...query,
        $or: [
          { orderId: { $regex: search, $options: 'i' } },
          ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
        ],
      };

      [orders, total] = await Promise.all([
        MedicineOrder.find(searchQuery)
          .populate('userId', 'firstName lastName mobileNumber email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        MedicineOrder.countDocuments(searchQuery),
      ]);
    } else {
      [orders, total] = await Promise.all([
        MedicineOrder.find(query)
          .populate('userId', 'firstName lastName mobileNumber email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        MedicineOrder.countDocuments(query),
      ]);
    }

    // Stats counts (always across all statuses, ignoring current filters)
    const [statsData] = await MedicineOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
    ]);

    const allStats = await MedicineOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts: Record<string, number> = {};
    allStats.forEach((s: any) => { statusCounts[s._id] = s.count; });

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + orders.length < total,
        hasPrev: page > 1,
      },
      statusCounts,
    });
  } catch (err: any) {
    console.error('[Admin] Medicine orders fetch error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}
