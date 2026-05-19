import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import { adminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await adminAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const search = searchParams.get('search') ?? '';
  const specialization = searchParams.get('specialization') ?? '';
  const isPublished = searchParams.get('isPublished');

  const query: Record<string, any> = { isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }
  if (specialization) query.specialization = specialization;
  if (isPublished !== null && isPublished !== '') query.isPublished = isPublished === 'true';

  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(query),
    Doctor.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v -isDeleted'),
  ]);

  return NextResponse.json({
    success: true,
    data: doctors,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const authResult = await adminAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();

  const body = await request.json();

  const exists = await Doctor.findOne({ slug: body.slug, isDeleted: false });
  if (exists) {
    return NextResponse.json(
      { success: false, message: 'A doctor with this slug already exists' },
      { status: 409 }
    );
  }

  const doctor = await Doctor.create({ ...body, createdBy: authResult.admin._id });

  return NextResponse.json({ success: true, data: doctor }, { status: 201 });
}
