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
import connectDB from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { initiateRefund } from '@/lib/services/cashfreeRefundService';

const worker = new Worker<ReminderJobData>(
  'appointment-reminders',
  async (job) => {
    // ── No-show expiry ────────────────────────────────────────────────────────
    if (job.name === 'no_show_expiry') {
      const { appointmentId } = job.data as any;
      console.log(`[ReminderWorker] Checking no-show expiry for ${appointmentId}`);
      await connectDB();

      // Atomically claim — prevents race with user cancel running simultaneously
      const mongoose = await import('mongoose');
      const appt = await ConsultationAppointment.collection.findOneAndUpdate(
        { _id: new mongoose.default.Types.ObjectId(appointmentId), status: { $in: ['pending', 'confirmed'] } },
        { $set: { status: 'no_show' } }
      );

      if (!appt) return; // already cancelled/completed

      const wasConfirmed = appt.status === 'confirmed';

      console.log(`[ReminderWorker] Marked ${appointmentId} as no_show (was: ${appt.status})`);

      // Refund only if NEVER confirmed AND no refund already in progress (guard against race with user cancel)
      if (!wasConfirmed && appt.payment?.status === 'paid' && (appt.payment as any).cfOrderId && !(appt.payment as any).refundId) {
        const { refundId, status } = await initiateRefund(
          (appt.payment as any).cfOrderId,
          appt.finalAmount,
          'Appointment expired without confirmation — auto refund'
        );
        await ConsultationAppointment.collection.updateOne(
          { _id: appt._id },
          {
            $set: {
              'payment.refundId':          refundId,
              'payment.refundAmount':      appt.finalAmount,
              'payment.refundStatus':      status === 'failed' ? 'failed' : 'initiated',
              'payment.refundInitiatedAt': new Date(),
            }
          }
        );
        console.log(`[ReminderWorker] Refund initiated for unconfirmed expired appointment ${appointmentId}: ${status}`);
      }

      return;
    }

    // ── Reminder ──────────────────────────────────────────────────────────────
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
