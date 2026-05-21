import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Medicine from '@/lib/models/Medicine';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

// ─── GET /api/admin/medicines/[id] ───────────────────────────────────────────

export async function GET(request: NextRequest, context: Context) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.MEDICINES_VIEW);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  await connectToDatabase();

  const medicine = await Medicine.findById(id).lean();
  if (!medicine) {
    return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: medicine });
}

// ─── PUT /api/admin/medicines/[id] ───────────────────────────────────────────

export async function PUT(request: NextRequest, context: Context) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.MEDICINES_EDIT);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  await connectToDatabase();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const medicine = await Medicine.findById(id);
  if (!medicine) {
    return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
  }

  // Recalculate discount
  const mrp = body.mrp ?? medicine.mrp;
  const offerPrice = body.offerPrice ?? medicine.offerPrice;
  body.discountPercentage = mrp > 0 ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

  if (authResult.role === 'admin') {
    body.updatedBy = authResult.admin._id;
  }

  // Slug uniqueness check (only if slug changed)
  if (body.slug && body.slug !== medicine.slug) {
    const exists = await Medicine.exists({ slug: body.slug, _id: { $ne: id } });
    if (exists) {
      return NextResponse.json({ success: false, message: 'Slug already taken' }, { status: 409 });
    }
  }

  const updated = await Medicine.findByIdAndUpdate(id, body, { new: true, runValidators: true });

  return NextResponse.json({ success: true, data: updated });
}

// ─── DELETE /api/admin/medicines/[id] ────────────────────────────────────────

export async function DELETE(request: NextRequest, context: Context) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.MEDICINES_EDIT);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  await connectToDatabase();

  const medicine = await Medicine.findById(id);
  if (!medicine) {
    return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
  }

  const deleteJobs = [
    ...(medicine.images ?? []).map((img) => deleteFromCloudinary(img.publicId)),
    ...(medicine.thumbnail ? [deleteFromCloudinary(medicine.thumbnail.publicId)] : []),
  ];
  await Promise.allSettled(deleteJobs);

  await Medicine.findByIdAndDelete(id);

  return NextResponse.json({ success: true, message: 'Medicine deleted successfully' });
}
