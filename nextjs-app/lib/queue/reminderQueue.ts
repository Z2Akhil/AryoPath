/**
 * BullMQ queue for scheduling appointment reminder notifications.
 *
 * A job is enqueued when an appointment is created, delayed until
 * exactly 5 minutes before the appointment start time.
 *
 * The worker (reminderWorker.ts) picks up each job and sends WhatsApp
 * reminders to both the patient and doctor.
 *
 * Requires Redis. Set REDIS_URL in .env (e.g. redis://localhost:6379).
 */

import { Queue } from 'bullmq';
import { getRedisConnection } from './redisConnection';

export interface ReminderJobData {
  appointmentId: string;
  patientName: string;
  patientMobile: string;
  doctorName: string;
  doctorMobile: string;
  appointmentTime: string;   // display string, e.g. "10:00 AM"
  consultationMode: 'video' | 'audio';
  shortId: string;           // last 8 chars of _id uppercase
  meetLink?: string;         // Google Meet URL — only for video consultations
}

let _queue: Queue<ReminderJobData> | null = null;

export function getReminderQueue(): Queue<ReminderJobData> {
  if (!_queue) {
    _queue = new Queue<ReminderJobData>('appointment-reminders', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,   // keep last 100 completed jobs for debugging
        removeOnFail: 200,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }
  return _queue;
}

/**
 * Schedule a reminder job for an appointment.
 * @param data     Job payload
 * @param fireAt   Exact Date when the reminder should fire (5 min before appointment)
 */
export async function scheduleReminder(data: ReminderJobData, fireAt: Date): Promise<void> {
  const delay = fireAt.getTime() - Date.now();

  if (delay <= 0) {
    // Appointment is too soon (already within 5 min) — send immediately
    await getReminderQueue().add('reminder', data, { delay: 0 });
    return;
  }

  await getReminderQueue().add('reminder', data, {
    delay,
    jobId: `reminder-${data.appointmentId}`,  // idempotent: won't duplicate on re-create
  });
}
