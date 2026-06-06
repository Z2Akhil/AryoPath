import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';
import { getMedicineOrderEmail, sendMedicineConfirmedEmail } from '@/lib/services/transactionalEmailService';

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
        const medOrder = await MedicineOrder.findOne({ 'payment.refundId': refundId });
        if (medOrder) {
          (medOrder.payment as any).refundStatus = mapped;
          if (mapped === 'processed') (medOrder.payment as any).refundCompletedAt = new Date();
          medOrder.markModified('payment');
          await medOrder.save();
        } else {
          // Try consultation appointment
          const appt = await ConsultationAppointment.findOne({ 'payment.refundId': refundId });
          if (appt) {
            (appt.payment as any).refundStatus = mapped;
            appt.markModified('payment');
            await appt.save();
          }
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
