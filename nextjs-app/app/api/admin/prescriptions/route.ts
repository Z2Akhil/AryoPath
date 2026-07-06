export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Prescription from '@/lib/models/Prescription';
import '@/lib/models/User';

// GET /api/admin/prescriptions — list uploaded prescriptions + pending count (for the badge).
export async function GET(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.PRESCRIPTION_BOOKING);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const status = searchParams.get('status'); // 'pending' | 'done' | null (all)

    const query: any = {};
    if (status === 'pending' || status === 'done') query.status = status;

    const skip = (page - 1) * limit;

    const [items, total, pendingCount] = await Promise.all([
      Prescription.find(query)
        .sort({ status: 1, createdAt: -1 }) // pending first, newest first
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName mobileNumber email')
        .lean(),
      Prescription.countDocuments(query),
      Prescription.countDocuments({ status: 'pending' }),
    ]);

    return NextResponse.json({
      success: true,
      prescriptions: items,
      pendingCount,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + items.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[admin/prescriptions] list error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}
