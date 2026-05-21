/**
 * BullMQ worker — processes appointment reminder jobs.
 *
 * Start this on the Hostinger VPS alongside the Next.js server:
 *   node -r ts-node/register lib/queue/reminderWorker.ts
 * Or add a script in package.json:
 *   "worker": "tsx lib/queue/reminderWorker.ts"
 *
 * The worker connects to Redis, picks up delayed jobs exactly when they fire,
 * and sends WhatsApp reminders via NotificationService.
 */

import { Worker } from 'bullmq';
import { getRedisConnection } from './redisConnection';
import { ReminderJobData } from './reminderQueue';
import NotificationService from '@/lib/services/notificationService';
import { reminderNotifications } from '@/lib/notifications/consultTemplates';

const worker = new Worker<ReminderJobData>(
  'appointment-reminders',
  async (job) => {
    const data = job.data;
    console.log(`[ReminderWorker] Processing reminder for appointment ${data.shortId}`);

    const payloads = reminderNotifications({
      patientName: data.patientName,
      patientMobile: data.patientMobile,
      doctorName: data.doctorName,
      doctorMobile: data.doctorMobile || undefined,
      appointmentTime: data.appointmentTime,
      consultationMode: data.consultationMode,
      shortId: data.shortId,
      meetLink: data.meetLink,
    });

    const results = await NotificationService.sendBulk(payloads);

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.warn(`[ReminderWorker] ${failed.length} notification(s) failed for ${data.shortId}:`,
        failed.map((f) => ({ mobile: f.mobile, error: f.message }))
      );
    } else {
      console.log(`[ReminderWorker] Reminders sent for ${data.shortId} to ${results.length} recipient(s)`);
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 10,   // process up to 10 reminder jobs simultaneously
  }
);

worker.on('completed', (job) => {
  console.log(`[ReminderWorker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[ReminderWorker] Started, waiting for jobs...');

export default worker;
