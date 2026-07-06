import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import PendingConsultBooking from '@/lib/models/PendingConsultBooking';
import { getMedicineOrderEmail, sendMedicineConfirmedEmail } from '@/lib/services/transactionalEmailService';
import { finalizeAppointmentConfirmation } from '@/lib/services/appointmentConfirmation';

function verifySignature(rawBody: string, timestamp: string, sig: string): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY || '';
  const computed = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('base64');
  return computed === sig;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const sig       = req.headers.get('x-webhook-signature') || '';

    if (!verifySignature(rawBody, timestamp, sig)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reject replays older than 5 minutes
    const tsMs = Number(timestamp) * 1000;
    if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Webhook expired' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventType = (body?.type ?? '').toUpperCase();

    // ── Refund status update ────────────────────────────────────────────────
    if (eventType.includes('REFUND')) {
      const refundStatus = (body?.data?.refund?.refund_status ?? '').toUpperCase();
      const refundId     = body?.data?.refund?.refund_id ?? '';
      const cfOrderId    = body?.data?.order?.order_id ?? '';

      if (refundId && cfOrderId) {
        await connectDB();
        const mapped = refundStatus === 'SUCCESS' ? 'processed' : refundStatus === 'CANCELLED' ? 'failed' : 'pending';

        // Try medicine order first
        const medOrder = await MedicineOrder.findOne({ 'payment.refundId': refundId }).select('_id').lean();
        if (medOrder) {
          await MedicineOrder.collection.updateOne(
            { _id: (medOrder as any)._id },
            { $set: {
              'payment.refundStatus': mapped,
              ...(mapped === 'processed' ? { 'payment.refundCompletedAt': new Date() } : {}),
            }}
          );
        } else {
          // Try consultation appointment
          const appt = await ConsultationAppointment.findOne({ 'payment.refundId': refundId }).select('_id').lean();
          if (appt) {
            await ConsultationAppointment.collection.updateOne(
              { _id: (appt as any)._id },
              { $set: { 'payment.refundStatus': mapped } }
            );
          }
        }
      }
      return NextResponse.json({ received: true });
    }

    // ── Payment Link event (on-behalf orders) ──────────────────────────────
    // link_id is our internal orderId (reconciliation key). link_status: PAID / PARTIALLY_PAID / EXPIRED / CANCELLED
    if (eventType === 'PAYMENT_LINK_EVENT') {
      const linkStatus = (body?.data?.link_status ?? '').toUpperCase();
      const linkId     = body?.data?.link_id ?? '';
      const cfOrderId  = body?.data?.order?.order_id ?? '';
      if (!linkId) return NextResponse.json({ received: true });

      await connectDB();

      // Medicine order? (link_id == orderId)
      const order = await MedicineOrder.findOne({ orderId: linkId }).lean();
      if (order) {
        const payStatus = (order as any).payment?.status;
        if (linkStatus === 'PAID' && payStatus !== 'paid') {
          await MedicineOrder.findByIdAndUpdate((order as any)._id, {
            'payment.status':   'paid',
            'payment.cfOrderId': cfOrderId ? String(cfOrderId) : '',
            'payment.paidAt':   new Date(),
            status: (order as any).requiresPrescription ? 'prescription_required' : 'confirmed',
            expiresAt: null, // paid — cancel the 48h TTL
          });
          await Promise.all(
            ((order as any).items ?? []).map(async (item: any) => {
              const updated = await Medicine.findByIdAndUpdate(
                item.medicineId, { $inc: { stockQuantity: -item.quantity } }, { returnDocument: 'after' },
              ).select('stockQuantity').lean();
              if (updated && (updated as any).stockQuantity <= 0) {
                await Medicine.findByIdAndUpdate(item.medicineId, { stockQuantity: 0, inStock: false });
              }
            }),
          );
          getMedicineOrderEmail(order).then(email => sendMedicineConfirmedEmail(order, email)).catch(console.error);
        } else if ((linkStatus === 'EXPIRED' || linkStatus === 'CANCELLED') && payStatus !== 'paid') {
          await MedicineOrder.findByIdAndUpdate((order as any)._id, { status: 'payment_failed' });
        }
        return NextResponse.json({ received: true });
      }

      // On-behalf consultation hold? (link_id == PendingConsultBooking _id)
      // The real appointment is created ONLY after payment.
      if (linkStatus === 'PAID') {
        const hold: any = await PendingConsultBooking.findOne({ 'paymentLink.linkId': linkId }).lean();
        if (hold) {
          // ── Create-THEN-delete, deduped on the sparse-unique sourceHoldId. ──
          // Guarantees: exactly one appointment per hold (concurrent webhooks safe),
          // and payment is never left without an appointment (create runs before delete).
          let appt: any = null;
          try {
            appt = await ConsultationAppointment.create({
              doctorId: hold.doctorId,
              doctorSlug: hold.doctorSlug,
              doctorName: hold.doctorName,
              doctorMobile: hold.doctorMobile || '',
              patientName: hold.patientName,
              patientMobile: hold.patientMobile,
              patientEmail: hold.patientEmail || '',
              patientAge: hold.patientAge,
              patientGender: hold.patientGender,
              symptoms: hold.symptoms || '',
              consultationMode: hold.consultationMode,
              appointmentDate: hold.appointmentDate,
              appointmentTime: hold.appointmentTime,
              appointmentDateTime: hold.appointmentDateTime,
              consultationFee: hold.consultationFee,
              platformDiscount: 0,
              finalAmount: hold.finalAmount,
              status: 'confirmed',
              payment: {
                status: 'paid',
                amount: hold.finalAmount,
                cfOrderId: cfOrderId ? String(cfOrderId) : '',
                paidAt: new Date(),
              },
              bookedByAdmin: true,
              userId: hold.userId,
              sourceHoldId: String(hold._id),   // unique dedup key
            });
          } catch (e: any) {
            if (e?.code === 11000) {
              // A concurrent webhook already created this appointment — safe to ignore.
              await PendingConsultBooking.deleteOne({ _id: hold._id }).catch(() => {});
              return NextResponse.json({ received: true });
            }
            // Real failure: payment succeeded but appointment couldn't be created.
            // Leave the hold intact for recovery and alert loudly.
            console.error(`[cashfree webhook] CRITICAL: paid hold ${hold._id} failed to convert (cfOrderId=${cfOrderId}):`, e);
            return NextResponse.json({ received: true });
          }

          // Appointment created — now safe to drop the hold. If this fails, the TTL cleans it.
          await PendingConsultBooking.deleteOne({ _id: hold._id }).catch(() => {});
          // Full confirmation suite (meet link, emails, WhatsApp, reminder, no-show)
          finalizeAppointmentConfirmation(appt).catch(console.error);
          return NextResponse.json({ received: true });
        }
      } else if (linkStatus === 'EXPIRED' || linkStatus === 'CANCELLED') {
        // Drop the hold → releases the slot
        const del = await PendingConsultBooking.deleteOne({ 'paymentLink.linkId': linkId });
        if (del.deletedCount > 0) return NextResponse.json({ received: true });
      }

      // Legacy: appointment created as pending (pre-refactor) — confirm/cancel in place
      const appt = await ConsultationAppointment.findOne({ 'paymentLink.linkId': linkId }).lean();
      if (appt) {
        const apPay = (appt as any).payment?.status;
        if (linkStatus === 'PAID' && apPay !== 'paid') {
          const confirmed = await ConsultationAppointment.findByIdAndUpdate(
            (appt as any)._id,
            { 'payment.status': 'paid', 'payment.cfOrderId': cfOrderId ? String(cfOrderId) : '', 'payment.paidAt': new Date(), status: 'confirmed' },
            { new: true },
          );
          if (confirmed) finalizeAppointmentConfirmation(confirmed).catch(console.error);
        } else if ((linkStatus === 'EXPIRED' || linkStatus === 'CANCELLED') && apPay !== 'paid') {
          await ConsultationAppointment.findByIdAndUpdate((appt as any)._id, {
            status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Payment link expired (unpaid)',
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    // ── Payment success ─────────────────────────────────────────────────────
    const paymentStatus = (body?.data?.payment?.payment_status ?? '').toUpperCase();
    if (paymentStatus !== 'SUCCESS') {
      return NextResponse.json({ received: true });
    }

    const cfOrderId   = body?.data?.order?.order_id;
    const cfPaymentId = body?.data?.payment?.cf_payment_id;

    if (!cfOrderId) return NextResponse.json({ received: true });

    await connectDB();

    const existing = await MedicineOrder
      .findOne({ 'payment.cfOrderId': cfOrderId })
      .lean();

    // Idempotent — skip if already processed
    if (!existing || (existing as any).payment?.status === 'paid') {
      return NextResponse.json({ received: true });
    }

    await MedicineOrder.findByIdAndUpdate((existing as any)._id, {
      'payment.cfPaymentId': cfPaymentId ? String(cfPaymentId) : '',
      'payment.status':      'paid',
      'payment.paidAt':      new Date(),
      status: (existing as any).requiresPrescription ? 'prescription_required' : 'confirmed',
      expiresAt: null, // cancel TTL — payment confirmed via webhook
    });

    // Decrement stock — same logic as the verify route
    await Promise.all(
      ((existing as any).items ?? []).map(async (item: any) => {
        const updated = await Medicine.findByIdAndUpdate(
          item.medicineId,
          { $inc: { stockQuantity: -item.quantity } },
          { returnDocument: 'after' },
        ).select('stockQuantity').lean();

        if (updated && (updated as any).stockQuantity <= 0) {
          await Medicine.findByIdAndUpdate(item.medicineId, {
            stockQuantity: 0,
            inStock: false,
          });
        }
      }),
    );

    getMedicineOrderEmail(existing).then(email => sendMedicineConfirmedEmail(existing, email)).catch(console.error);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Cashfree webhook]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
