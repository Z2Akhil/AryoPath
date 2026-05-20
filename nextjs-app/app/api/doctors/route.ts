import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get('specialty');

    const query: Record<string, unknown> = {
      isDeleted: { $ne: true },
      isPublished: true,
      isActive: true,
    };

    if (specialty) {
      query.specialization = { $regex: specialty, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .select(
        'name slug profilePhoto specialization experience qualifications consultationFee followUpFee consultationModes instantConsultation isVerified isFeatured isOnline availableTimeSlots availableDays languages shortBio symptomsTreated conditionsTreated _id'
      )
      .lean();

    return NextResponse.json({ success: true, data: doctors });
  } catch (error) {
    console.error('[GET /api/doctors] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
