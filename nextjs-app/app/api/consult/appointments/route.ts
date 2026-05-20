import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';

export const dynamic = 'force-dynamic';

function getUserIdFromRequest(req: NextRequest): string | null {
  try {
    // Check Authorization header first
    const authHeader = req.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      // Check cookie
      token = req.cookies.get('token')?.value ?? null;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      id: string;
    };
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = getUserIdFromRequest(req);

    const body = await req.json();
    const {
      doctorSlug,
      patientName,
      patientMobile,
      patientAge,
      patientGender,
      symptoms,
      consultationMode,
      appointmentDate,
      appointmentTime,
      couponCode,
      reportUrls,
    } = body;

    // Validate required fields
    if (
      !doctorSlug ||
      !patientName ||
      !patientMobile ||
      !patientAge ||
      !patientGender ||
      !consultationMode ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Look up doctor
    const doctor = await Doctor.findOne({
      slug: doctorSlug,
      isDeleted: { $ne: true },
      isPublished: true,
      isActive: true,
    })
      .select('_id name slug consultationFee')
      .lean();

    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const consultationFee = doctor.consultationFee || 0;
    const platformDiscount = 0;

    let couponDiscount = 0;
    let appliedCoupon = '';
    if (couponCode === 'AYRO20') {
      couponDiscount = Math.round(consultationFee * 0.2);
      appliedCoupon = 'AYRO20';
    } else if (couponCode === 'FIRST100') {
      couponDiscount = Math.min(100, consultationFee);
      appliedCoupon = 'FIRST100';
    }

    const finalAmount = Math.max(0, consultationFee - couponDiscount);

    const appointment = await ConsultationAppointment.create({
      doctorId: doctor._id,
      doctorSlug: doctor.slug,
      doctorName: doctor.name,
      patientName,
      patientMobile,
      patientAge: Number(patientAge),
      patientGender,
      symptoms: symptoms || '',
      consultationMode,
      appointmentDate,
      appointmentTime,
      consultationFee,
      platformDiscount,
      couponCode: appliedCoupon,
      couponDiscount,
      finalAmount,
      status: 'pending',
      reportUrls: reportUrls || [],
      ...(userId ? { userId } : {}),
    });

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/consult/appointments] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
