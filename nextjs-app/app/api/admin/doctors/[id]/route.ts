import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import { adminAuth, adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.DOCTORS_VIEW);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();
  const { id } = await params;

  const doctor = await Doctor.findOne({ _id: id, isDeleted: false }).select('-__v -isDeleted');
  if (!doctor) {
    return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: doctor });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await adminAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();
  const { id } = await params;
  const body = await request.json();

  if (body.slug) {
    const conflict = await Doctor.findOne({ slug: body.slug, _id: { $ne: id }, isDeleted: false });
    if (conflict) {
      return NextResponse.json({ success: false, message: 'Slug already in use' }, { status: 409 });
    }
  }

  const doctor = await Doctor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { ...body, updatedBy: authResult.admin._id },
    { new: true, runValidators: true }
  ).select('-__v -isDeleted');

  if (!doctor) {
    return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: doctor });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const authResult = await adminAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();
  const { id } = await params;

  const doctor = await Doctor.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, updatedBy: authResult.admin._id },
    { new: true }
  );

  if (!doctor) {
    return NextResponse.json({ success: false, message: 'Doctor not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Doctor deleted' });
}
