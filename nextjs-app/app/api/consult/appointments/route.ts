import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { sendConsultBookedEmail, sendDoctorNewAppointmentEmail } from '@/lib/services/transactionalEmailService';
import NotificationService from '@/lib/services/notificationService';
import { confirmationNotifications } from '@/lib/notifications/consultTemplates';
import { scheduleReminder } from '@/lib/queue/reminderQueue';
import { generateMeetLink } from '@/lib/utils/meetLink';

export const dynamic = 'force-dynamic';

function getUserIdFromRequest(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies.get('token')?.value ?? null;
    }

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Parse "2026-05-20" + "10:00 AM" → UTC Date (treating input as IST).
 */
function parseAppointmentDateTime(date: string, time: string): Date {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  let hours = 0;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const [year, month, day] = date.split('-').map(Number);
  // Convert IST (UTC+5:30) to UTC
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - (5 * 60 + 30) * 60 * 1000);
}

function shortId(id: { toString(): string }): string {
  return id.toString().slice(-8).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      doctorSlug,
      patientName,
      patientMobile,
      patientEmail,
      patientAge,
      patientGender,
      symptoms,
      consultationMode,
      appointmentDate,
      appointmentTime,
      couponCode,
      reportUrls,
      cfOrderId,
      cfPaymentId,
    } = body;

    if (
      !doctorSlug || !patientName || !patientMobile || !patientAge ||
      !patientGender || !consultationMode || !appointmentDate || !appointmentTime
    ) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({
      slug: doctorSlug,
      isDeleted: { $ne: true },
      isPublished: true,
      isActive: true,
    })
      .select('_id name slug consultationFee mobile')
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

    // Verify Cashfree payment when amount > 0
    if (finalAmount > 0) {
      if (!cfOrderId) {
        return NextResponse.json({ success: false, error: 'Payment required to book appointment' }, { status: 400 });
      }
      const cfBase = process.env.CASHFREE_ENV === 'production'
        ? 'https://api.cashfree.com'
        : 'https://sandbox.cashfree.com';
      const cfVerifyRes = await fetch(`${cfBase}/pg/orders/${cfOrderId}`, {
        headers: {
          'x-client-id':     process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version':   '2023-08-01',
        },
      });
      const cfOrder = await cfVerifyRes.json();
      if (cfOrder.order_status !== 'PAID') {
        return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 });
      }
    }

    const appointmentDateTime = parseAppointmentDateTime(appointmentDate, appointmentTime);
    const doctorMobile = (doctor as any).mobile || '';

    const appointment = await ConsultationAppointment.create({
      doctorId: doctor._id,
      doctorSlug: doctor.slug,
      doctorName: doctor.name,
      doctorMobile,
      patientName,
      patientMobile,
      patientEmail: patientEmail || '',
      patientAge: Number(patientAge),
      patientGender,
      symptoms: symptoms || '',
      consultationMode,
      appointmentDate,
      appointmentTime,
      appointmentDateTime,
      meetLink: '',
      consultationFee,
      platformDiscount,
      couponCode: appliedCoupon,
      couponDiscount,
      finalAmount,
      status: 'pending',
      reportUrls: reportUrls || [],
      payment: finalAmount > 0
        ? { cfOrderId, cfPaymentId: cfPaymentId || '', status: 'paid', amount: finalAmount, paidAt: new Date() }
        : { status: 'not_required', amount: 0 },
      reminderSent: false,
      ...(userId ? { userId } : {}),
    });

    // Generate meet link now that we have the appointment _id
    const meetLink = consultationMode === 'video' ? generateMeetLink(appointment._id.toString()) : '';
    if (meetLink) {
      appointment.meetLink = meetLink;
      await appointment.save();
    }

    const apptShortId = shortId(appointment._id);

    // ── Send confirmation emails (non-blocking) ───────────────────────────────
    sendConsultBookedEmail(appointment).catch(console.error);
    sendDoctorNewAppointmentEmail(appointment).catch(console.error);

    // ── Send confirmation WhatsApp (non-blocking) ──────────────────────────────
    NotificationService.sendAsync(
      confirmationNotifications({
        patientName,
        patientMobile,
        doctorName: doctor.name,
        doctorMobile: doctorMobile || undefined,
        appointmentDate,
        appointmentTime,
        consultationMode,
        shortId: apptShortId,
        finalAmount,
        meetLink: meetLink || undefined,
      })
    );

    // ── Schedule 5-minute reminder via BullMQ ─────────────────────────────────
    const reminderFireAt = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
    scheduleReminder(
      {
        appointmentId: appointment._id.toString(),
        patientName,
        patientMobile,
        doctorName: doctor.name,
        doctorMobile,
        appointmentTime,
        consultationMode,
        shortId: apptShortId,
        meetLink: meetLink || undefined,
      },
      reminderFireAt
    ).catch((err) => console.error('[appointments] Failed to schedule reminder:', err));

    return NextResponse.json({ success: true, data: appointment }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/consult/appointments] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create appointment' }, { status: 500 });
  }
}
