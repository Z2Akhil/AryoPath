import { sendConsultBookedEmail, sendDoctorNewAppointmentEmail } from '@/lib/services/transactionalEmailService';
import NotificationService from '@/lib/services/notificationService';
import { confirmationNotifications } from '@/lib/notifications/consultTemplates';
import { scheduleReminder, scheduleNoShowExpiry } from '@/lib/queue/reminderQueue';
import { generateMeetLink } from '@/lib/utils/meetLink';

function shortId(id: { toString(): string }): string {
  return id.toString().slice(-8).toUpperCase();
}

/**
 * Fires the full confirmation suite for an appointment that has just become paid/confirmed:
 *   meet link → patient + doctor emails → WhatsApp confirmation → 5-min reminder job → no-show expiry job.
 *
 * Mirrors the self-serve consult booking flow (app/api/consult/appointments) so an on-behalf
 * (payment-link) appointment behaves identically once the link is paid. Idempotent-safe:
 * only call it once per appointment (webhook guards on payment.status flipping to paid).
 *
 * @param appt A full (non-lean) Mongoose ConsultationAppointment document.
 */
export async function finalizeAppointmentConfirmation(appt: any): Promise<void> {
  try {
    // Meet link (video only) — generate + persist if not already set
    let meetLink: string = appt.meetLink || '';
    if (appt.consultationMode === 'video' && !meetLink) {
      meetLink = generateMeetLink(appt._id.toString());
      appt.meetLink = meetLink;
      await appt.save();
    }

    const apptShortId = shortId(appt._id);

    // Emails (non-blocking)
    sendConsultBookedEmail(appt).catch(console.error);
    sendDoctorNewAppointmentEmail(appt).catch(console.error);

    // WhatsApp confirmation (non-blocking)
    NotificationService.sendAsync(
      confirmationNotifications({
        patientName: appt.patientName,
        patientMobile: appt.patientMobile,
        doctorName: appt.doctorName,
        doctorMobile: appt.doctorMobile || undefined,
        appointmentDate: appt.appointmentDate,
        appointmentTime: appt.appointmentTime,
        consultationMode: appt.consultationMode,
        shortId: apptShortId,
        finalAmount: appt.finalAmount,
        meetLink: meetLink || undefined,
      } as any)
    );

    // 5-minute reminder job (BullMQ)
    const reminderFireAt = new Date(appt.appointmentDateTime.getTime() - 5 * 60 * 1000);
    scheduleReminder(
      {
        appointmentId: appt._id.toString(),
        patientName: appt.patientName,
        patientMobile: appt.patientMobile,
        doctorName: appt.doctorName,
        doctorMobile: appt.doctorMobile || '',
        appointmentTime: appt.appointmentTime,
        consultationMode: appt.consultationMode,
        shortId: apptShortId,
        meetLink: meetLink || undefined,
      },
      reminderFireAt,
    ).catch((err) => console.error('[appointmentConfirmation] reminder schedule failed:', err));

    // No-show expiry job — 30 min after slot start
    const expiryAt = new Date(appt.appointmentDateTime.getTime() + 30 * 60 * 1000);
    scheduleNoShowExpiry(appt._id.toString(), expiryAt)
      .catch((err) => console.error('[appointmentConfirmation] no-show schedule failed:', err));
  } catch (err) {
    console.error('[appointmentConfirmation] error:', err);
  }
}
