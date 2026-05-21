import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Medicine from '@/lib/models/Medicine';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';

export const dynamic = 'force-dynamic';

// ─── GET /api/admin/medicines ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.MEDICINES_VIEW);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '10'));
  const search = searchParams.get('search') ?? '';
  const type = searchParams.get('type') ?? '';
  const isPublished = searchParams.get('isPublished');
  const inStock = searchParams.get('inStock');

  const query: any = {};
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { sku: new RegExp(search, 'i') }];
  if (type) query.type = type;
  if (isPublished !== null && isPublished !== '') query.isPublished = isPublished === 'true';
  if (inStock !== null && inStock !== '') query.inStock = inStock === 'true';

  const [medicines, total] = await Promise.all([
    Medicine.find(query)
      .select('name slug type category mrp offerPrice discountPercentage thumbnail stockQuantity inStock isPublished isDraft createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Medicine.countDocuments(query),
  ]);

  return NextResponse.json({
    success: true,
    data: medicines,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// ─── POST /api/admin/medicines ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authResult = await adminOrStaffAuth(request, PERMISSIONS.MEDICINES_EDIT);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, slug, type, mrp, offerPrice } = body;

  if (!name?.trim()) return NextResponse.json({ success: false, message: 'Medicine name is required' }, { status: 400 });
  if (!slug?.trim()) return NextResponse.json({ success: false, message: 'Slug is required' }, { status: 400 });
  if (!type) return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
  if (!mrp || mrp <= 0) return NextResponse.json({ success: false, message: 'MRP must be greater than 0' }, { status: 400 });
  if (offerPrice === undefined || offerPrice === null) return NextResponse.json({ success: false, message: 'Offer price is required' }, { status: 400 });
  if (offerPrice > mrp) return NextResponse.json({ success: false, message: 'Offer price must be ≤ MRP' }, { status: 400 });

  const slugExists = await Medicine.exists({ slug: body.slug });
  if (slugExists) {
    return NextResponse.json({ success: false, message: 'A medicine with this slug already exists' }, { status: 409 });
  }

  const discountPercentage = mrp > 0 ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

  const medicine = await Medicine.create({
    ...body,
    discountPercentage,
    createdBy: getAdminContext(authResult).adminId,
    updatedBy: getAdminContext(authResult).adminId,
  });

  return NextResponse.json({ success: true, data: medicine }, { status: 201 });
}
