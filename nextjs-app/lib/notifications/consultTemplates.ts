/**
 * Consultation WhatsApp notification templates.
 *
 * Each function returns NotificationPayload[] — one payload per recipient.
 * Pass the array directly to NotificationService.sendAsync() or sendBulk().
 *
 * Template names must EXACTLY match what Message Central returns after Meta approval.
 * Register templates via WhatsAppService.createTemplate() or the MC dashboard.
 *
 * Template bodies (submit these to MC for Meta approval):
 * ─────────────────────────────────────────────────────────────────────────────
 * PATIENT TEMPLATES
 *
 * appt_confirmation_patient_video  (category: UTILITY)
 *   "Dear {{1}}, your video consultation with Dr. {{2}} is confirmed for {{3}}
 *    at {{4}}. Join meeting: {{5}}. Booking ID: {{6}}. Amount: ₹{{7}}.
 *    Be ready 2 mins early. - AyroPath"
 *   Variables: patientName, doctorName, date, time, meetLink, shortId, amount
 *
 * appt_confirmation_patient_audio  (category: UTILITY)
 *   "Dear {{1}}, your audio consultation with Dr. {{2}} is confirmed for {{3}}
 *    at {{4}}. Booking ID: {{5}}. Amount: ₹{{6}}. Doctor will call you at your
 *    registered number. - AyroPath"
 *   Variables: patientName, doctorName, date, time, shortId, amount
 *
 * appt_reminder_patient_video  (category: UTILITY)
 *   "Reminder: Your video consultation with Dr. {{1}} starts in 5 minutes at
 *    {{2}}. Join here: {{3}}. Booking ID: {{4}}. - AyroPath"
 *   Variables: doctorName, time, meetLink, shortId
 *
 * appt_reminder_patient_audio  (category: UTILITY)
 *   "Reminder: Your audio consultation with Dr. {{1}} starts in 5 minutes at
 *    {{2}}. Doctor will call shortly. Booking ID: {{3}}. - AyroPath"
 *   Variables: doctorName, time, shortId
 *
 * appt_cancelled_patient  (category: UTILITY)
 *   "Dear {{1}}, your appointment with Dr. {{2}} on {{3}} at {{4}} has been
 *    cancelled. Booking ID: {{5}}. Contact support for assistance. - AyroPath"
 *   Variables: patientName, doctorName, date, time, shortId
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DOCTOR TEMPLATES
 *
 * appt_confirmation_doctor_video  (category: UTILITY)
 *   "AyroPath: New video appointment. Patient: {{1}} ({{2}}), Date: {{3}},
 *    Time: {{4}}. Join: {{5}}. Booking: {{6}}. Please be available on time."
 *   Variables: patientName, patientMobile, date, time, meetLink, shortId
 *
 * appt_confirmation_doctor_audio  (category: UTILITY)
 *   "AyroPath: New audio appointment. Patient: {{1}}, Mobile: {{2}},
 *    Date: {{3}}, Time: {{4}}. Booking: {{5}}. Call patient at scheduled time."
 *   Variables: patientName, patientMobile, date, time, shortId
 *
 * appt_reminder_doctor_video  (category: UTILITY)
 *   "AyroPath Reminder: {{1}} has a video consultation in 5 minutes at {{2}}.
 *    Join: {{3}}. Booking: {{4}}. Please be ready."
 *   Variables: patientName, time, meetLink, shortId
 *
 * appt_reminder_doctor_audio  (category: UTILITY)
 *   "AyroPath Reminder: {{1}} has an audio consultation in 5 minutes at {{2}}.
 *    Call {{3}}. Booking: {{4}}. Please be ready."
 *   Variables: patientName, time, patientMobile, shortId
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NotificationPayload } from '@/lib/services/notificationService';

const TEMPLATES = {
  APPT_CONFIRMATION_PATIENT_VIDEO: 'appt_confirmation_patient_video',
  APPT_CONFIRMATION_PATIENT_AUDIO: 'appt_confirmation_patient_audio',
  APPT_CONFIRMATION_DOCTOR_VIDEO:  'appt_confirmation_doctor_video',
  APPT_CONFIRMATION_DOCTOR_AUDIO:  'appt_confirmation_doctor_audio',
  APPT_REMINDER_PATIENT_VIDEO:     'appt_reminder_patient_video',
  APPT_REMINDER_PATIENT_AUDIO:     'appt_reminder_patient_audio',
  APPT_REMINDER_DOCTOR_VIDEO:      'appt_reminder_doctor_video',
  APPT_REMINDER_DOCTOR_AUDIO:      'appt_reminder_doctor_audio',
  APPT_CANCELLED_PATIENT:          'appt_cancelled_patient',
} as const;

export interface ConsultConfirmationData {
  patientName: string;
  patientMobile: string;
  doctorName: string;
  doctorMobile?: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationMode: 'video' | 'audio';
  shortId: string;
  finalAmount: number;
  meetLink?: string;
}

export interface ConsultReminderData {
  patientName: string;
  patientMobile: string;
  doctorName: string;
  doctorMobile?: string;
  appointmentTime: string;
  consultationMode: 'video' | 'audio';
  shortId: string;
  meetLink?: string;
}

export interface ConsultCancellationData {
  patientName: string;
  patientMobile: string;
  doctorName: string;
  doctorMobile?: string;
  appointmentDate: string;
  appointmentTime: string;
  shortId: string;
}

function clean(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.slice(-10);
}

function wa(mobile: string, templateName: string, variables: string[]): NotificationPayload {
  return { channel: 'whatsapp', mobile: clean(mobile), templateName, variables };
}

/** Confirmation messages sent immediately after appointment is created. */
export function confirmationNotifications(data: ConsultConfirmationData): NotificationPayload[] {
  const isVideo = data.consultationMode === 'video';
  const payloads: NotificationPayload[] = [];

  // ── Patient ───────────────────────────────────────────────────────────────
  if (isVideo && data.meetLink) {
    payloads.push(
      wa(data.patientMobile, TEMPLATES.APPT_CONFIRMATION_PATIENT_VIDEO, [
        data.patientName,
        data.doctorName,
        data.appointmentDate,
        data.appointmentTime,
        data.meetLink,
        data.shortId,
        String(data.finalAmount),
      ])
    );
  } else {
    payloads.push(
      wa(data.patientMobile, TEMPLATES.APPT_CONFIRMATION_PATIENT_AUDIO, [
        data.patientName,
        data.doctorName,
        data.appointmentDate,
        data.appointmentTime,
        data.shortId,
        String(data.finalAmount),
      ])
    );
  }

  // ── Doctor ────────────────────────────────────────────────────────────────
  if (data.doctorMobile) {
    if (isVideo && data.meetLink) {
      payloads.push(
        wa(data.doctorMobile, TEMPLATES.APPT_CONFIRMATION_DOCTOR_VIDEO, [
          data.patientName,
          clean(data.patientMobile),
          data.appointmentDate,
          data.appointmentTime,
          data.meetLink,
          data.shortId,
        ])
      );
    } else {
      payloads.push(
        wa(data.doctorMobile, TEMPLATES.APPT_CONFIRMATION_DOCTOR_AUDIO, [
          data.patientName,
          clean(data.patientMobile),
          data.appointmentDate,
          data.appointmentTime,
          data.shortId,
        ])
      );
    }
  }

  return payloads;
}

/** Reminder messages sent 5 minutes before the appointment (via BullMQ worker). */
export function reminderNotifications(data: ConsultReminderData): NotificationPayload[] {
  const isVideo = data.consultationMode === 'video';
  const payloads: NotificationPayload[] = [];

  // ── Patient ───────────────────────────────────────────────────────────────
  if (isVideo && data.meetLink) {
    payloads.push(
      wa(data.patientMobile, TEMPLATES.APPT_REMINDER_PATIENT_VIDEO, [
        data.doctorName,
        data.appointmentTime,
        data.meetLink,
        data.shortId,
      ])
    );
  } else {
    payloads.push(
      wa(data.patientMobile, TEMPLATES.APPT_REMINDER_PATIENT_AUDIO, [
        data.doctorName,
        data.appointmentTime,
        data.shortId,
      ])
    );
  }

  // ── Doctor ────────────────────────────────────────────────────────────────
  if (data.doctorMobile) {
    if (isVideo && data.meetLink) {
      payloads.push(
        wa(data.doctorMobile, TEMPLATES.APPT_REMINDER_DOCTOR_VIDEO, [
          data.patientName,
          data.appointmentTime,
          data.meetLink,
          data.shortId,
        ])
      );
    } else {
      payloads.push(
        wa(data.doctorMobile, TEMPLATES.APPT_REMINDER_DOCTOR_AUDIO, [
          data.patientName,
          data.appointmentTime,
          clean(data.patientMobile),
          data.shortId,
        ])
      );
    }
  }

  return payloads;
}

/** Cancellation messages sent when an appointment is cancelled. */
export function cancellationNotifications(data: ConsultCancellationData): NotificationPayload[] {
  return [
    wa(data.patientMobile, TEMPLATES.APPT_CANCELLED_PATIENT, [
      data.patientName,
      data.doctorName,
      data.appointmentDate,
      data.appointmentTime,
      data.shortId,
    ]),
  ];
}
