export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import Doctor from '@/lib/models/Doctor';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import PendingConsultBooking from '@/lib/models/PendingConsultBooking';
import { createPaymentLink } from '@/lib/services/cashfreePaymentLinkService';
import { finalizeAppointmentConfirmation } from '@/lib/services/appointmentConfirmation';

const LINK_EXPIRY_HOURS = 48;

// Parse "YYYY-MM-DD" + "HH:MM"/"h:MM AM" (IST) → UTC Date
function parseAppointmentDateTime(date: string, time: string): Date {
  let hours = 0, minutes = 0;
  const m12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const m24 = time.match(/^(\d{1,2}):(\d{2})$/);
  if (m12) {
    hours = parseInt(m12[1], 10);
    minutes = parseInt(m12[2], 10);
    const mer = m12[3].toUpperCase();
    if (mer === 'PM' && hours !== 12) hours += 12;
    if (mer === 'AM' && hours === 12) hours = 0;
  } else if (m24) {
    hours = parseInt(m24[1], 10);
    minutes = parseInt(m24[2], 10);
  }
  const [y, mo, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, hours, minutes) - (5 * 60 + 30) * 60 * 1000);
}

// POST /api/admin/appointments/book-on-behalf
// Books a consultation for a user (from a phone call). Payment link is mandatory when a fee applies.
// The pending appointment holds the slot; it releases (cancel) if unpaid at 48h.
export async function POST(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.PRESCRIPTION_BOOKING);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    await connectDB();
    const body = await req.json();
    const {
      userId,
      doctorSlug,
      patientName, patientAge, patientGender, patientMobile, patientEmail,
      consultationMode, appointmentDate, appointmentTime, symptoms,
    } = body;

    // Required fields
    if (!userId || !doctorSlug || !patientName || !patientAge || !patientGender ||
        !patientMobile || !consultationMode || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(String(patientMobile).trim())) {
      return NextResponse.json({ success: false, error: 'Valid 10-digit patient mobile is required' }, { status: 400 });
    }

    const user = await User.findById(userId).select('_id isActive').lean();
    if (!user || !(user as any).isActive) {
      return NextResponse.json({ success: false, error: 'Target user not found or inactive' }, { status: 404 });
    }

    const doctor = await Doctor.findOne({ slug: doctorSlug, isActive: true, isDeleted: { $ne: true } })
      .select('_id name slug consultationFee mobile').lean();
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found or unavailable' }, { status: 404 });
    }

    const appointmentDateTime = parseAppointmentDateTime(appointmentDate, appointmentTime);
    if (isNaN(appointmentDateTime.getTime()) || appointmentDateTime.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: 'Appointment must be a valid future date/time' }, { status: 400 });
    }

    // Slot must be free — blocked by a non-cancelled appointment OR an active (unexpired) hold.
    const now = new Date();
    const [apptClash, holdClash] = await Promise.all([
      ConsultationAppointment.findOne({ doctorSlug, appointmentDate, appointmentTime, status: { $nin: ['cancelled'] } }).select('_id').lean(),
      PendingConsultBooking.findOne({ doctorSlug, appointmentDate, appointmentTime, expiresAt: { $gt: now } }).select('_id').lean(),
    ]);
    if (apptClash || holdClash) {
      return NextResponse.json({ success: false, error: 'That slot is already booked. Pick another.' }, { status: 409 });
    }

    const consultationFee = (doctor as any).consultationFee || 0;
    const finalAmount = Math.max(0, consultationFee);

    const commonData = {
      doctorId: (doctor as any)._id,
      doctorSlug: (doctor as any).slug,
      doctorName: (doctor as any).name,
      doctorMobile: (doctor as any).mobile || '',
      patientName: String(patientName).trim(),
      patientMobile: String(patientMobile).trim(),
      patientEmail: patientEmail ? String(patientEmail).trim() : '',
      patientAge: parseInt(patientAge),
      patientGender,
      symptoms: symptoms ? String(symptoms).trim() : '',
      consultationMode,
      appointmentDate,
      appointmentTime,
      appointmentDateTime,
      consultationFee,
      finalAmount,
    };

    // ── Free consult (no fee): create the appointment directly, no payment/hold ──
    if (finalAmount === 0) {
      const appt: any = await ConsultationAppointment.create({
        ...commonData,
        platformDiscount: 0,
        status: 'confirmed',
        payment: { status: 'not_required', amount: 0 },
        bookedByAdmin: true,
        userId,
      } as any);
      finalizeAppointmentConfirmation(appt).catch(console.error);
      return NextResponse.json({
        success: true,
        appointment: { _id: appt._id, doctorName: (doctor as any).name, appointmentDate, appointmentTime, finalAmount, status: 'confirmed' },
        paymentLink: undefined,
      }, { status: 201 });
    }

    // ── Paid consult: create a HOLD (reserves the slot), NOT an appointment. ──
    // The real appointment is created only after payment (webhook).
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000);
    const hold: any = await PendingConsultBooking.create({
      ...commonData,
      userId,
      expiresAt,
    } as any);

    const link = await createPaymentLink({
      linkId: hold._id.toString(),
      amount: finalAmount,
      purpose: `Ayropath consultation with ${(doctor as any).name}`,
      customerName: String(patientName).trim(),
      customerPhone: String(patientMobile).trim(),
      customerEmail: patientEmail ? String(patientEmail).trim() : undefined,
      expiryHours: LINK_EXPIRY_HOURS,
    });

    if (!link.success) {
      // Roll back the hold → frees the slot
      await PendingConsultBooking.deleteOne({ _id: hold._id });
      return NextResponse.json({ success: false, error: link.error || 'Failed to create payment link' }, { status: 502 });
    }

    await PendingConsultBooking.collection.updateOne(
      { _id: hold._id },
      { $set: { paymentLink: { linkId: link.linkId, url: link.url, expiresAt: link.expiresAt } } }
    );

    return NextResponse.json({
      success: true,
      appointment: { holdId: hold._id, doctorName: (doctor as any).name, appointmentDate, appointmentTime, finalAmount, status: 'awaiting_payment' },
      paymentLink: link.url,
    }, { status: 201 });
  } catch (err) {
    console.error('[appointment book-on-behalf] error:', err);
    const message = err instanceof Error ? err.message : 'Failed to book appointment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
