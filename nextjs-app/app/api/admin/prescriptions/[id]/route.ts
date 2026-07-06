export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Prescription from '@/lib/models/Prescription';
import '@/lib/models/User';

// GET /api/admin/prescriptions/[id] — single prescription detail.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.PRESCRIPTION_BOOKING);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const { id } = await params;

    const prescription = await Prescription.findById(id)
      .populate('userId', 'firstName lastName mobileNumber email')
      .lean();

    if (!prescription) {
      return NextResponse.json({ success: false, error: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, prescription });
  } catch (err) {
    console.error('[admin/prescriptions] detail error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch prescription' }, { status: 500 });
  }
}

// PATCH /api/admin/prescriptions/[id] — mark done / reopen, optionally attach created order ids.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.PRESCRIPTION_BOOKING);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { action, orderId } = await req.json().catch(() => ({}));

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return NextResponse.json({ success: false, error: 'Prescription not found' }, { status: 404 });
    }

    const isStaff = (auth as any).role === 'staff';
    const actorId    = isStaff ? (auth as any).staff._id : (auth as any).admin._id;
    const actorModel = isStaff ? 'Staff' : 'Admin';

    if (action === 'mark_done') {
      prescription.status = 'done';
      (prescription as any).handledBy = actorId;
      (prescription as any).handledByModel = actorModel;
      (prescription as any).handledAt = new Date();
    } else if (action === 'reopen') {
      prescription.status = 'pending';
      (prescription as any).handledBy = undefined;
      (prescription as any).handledByModel = undefined;
      (prescription as any).handledAt = undefined;
    } else if (action === 'attach_order') {
      if (orderId && !prescription.createdOrderIds.includes(orderId)) {
        prescription.createdOrderIds.push(orderId);
      }
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await prescription.save();

    const populated = await Prescription.findById(id)
      .populate('userId', 'firstName lastName mobileNumber email')
      .lean();

    return NextResponse.json({ success: true, prescription: populated });
  } catch (err) {
    console.error('[admin/prescriptions] update error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update prescription' }, { status: 500 });
  }
}
