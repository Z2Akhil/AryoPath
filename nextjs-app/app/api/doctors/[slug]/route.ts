import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectToDatabase();

    const doctor = await Doctor.findOne({
      slug,
      isDeleted: { $ne: true },
      isPublished: true,
      isActive: true,
    })
      .select('-mobile -whatsapp -email -registrationNumber -medicalCouncil -createdBy -updatedBy')
      .lean();

    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (error) {
    console.error('[GET /api/doctors/[slug]] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch doctor' }, { status: 500 });
  }
}
