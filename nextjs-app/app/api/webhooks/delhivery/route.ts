import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import type { MedicineOrderStatus } from '@/types/medicineOrder';

// Maps Delhivery scan status keywords → our order milestone status
function mapCourierStatus(courierStatus: string): MedicineOrderStatus | null {
  const s = courierStatus.toLowerCase();
  if (s.includes('delivered') && !s.includes('undelivered'))  return 'delivered';
  if (s.includes('out for delivery') || s.includes('out_for_delivery')) return 'out_for_delivery';
  if (s.includes('in transit') || s.includes('intransit') || s.includes('manifested') || s.includes('shipped')) return 'shipped';
  return null;
}

// Delhivery pushes status updates here.
// Register this URL in the Delhivery seller dashboard as the webhook endpoint.
export async function POST(req: NextRequest) {
  try {
    // Optional: verify shared secret from Delhivery
    const secret = process.env.DELHIVERY_WEBHOOK_SECRET;
    if (secret) {
      const incomingSecret = req.headers.get('x-delhivery-secret') ?? req.nextUrl.searchParams.get('secret');
      if (incomingSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    // Delhivery webhook payload shape (may vary — adapt to actual payload from their docs)
    const packages: any[] = body?.packages ?? (Array.isArray(body) ? body : [body]);

    await connectDB();

    for (const pkg of packages) {
      const awb = pkg?.waybill ?? pkg?.AWB ?? pkg?.awb;
      if (!awb) continue;

      const order = await MedicineOrder.findOne({ awb: String(awb) });
      if (!order) continue;

      const status    = pkg?.status ?? pkg?.Status ?? '';
      const activity  = pkg?.instructions ?? pkg?.activity ?? pkg?.Activity ?? '';
      const location  = pkg?.city ?? pkg?.City ?? pkg?.location ?? '';
      const timestamp = new Date(pkg?.timestamp ?? pkg?.status_time ?? Date.now());

      (order as any).courierStatus = status;
      (order as any).courierStatusUpdatedAt = new Date();

      const existing: any[] = (order as any).courierStatusHistory ?? [];
      const alreadyRecorded = existing.some(
        (e: any) => e.status === status && Math.abs(new Date(e.timestamp).getTime() - timestamp.getTime()) < 60000
      );
      if (!alreadyRecorded) {
        existing.unshift({ status, activity, location, timestamp });
        (order as any).courierStatusHistory = existing;
      }

      const mappedStatus = mapCourierStatus(status);
      if (mappedStatus && order.status !== mappedStatus) {
        order.status = mappedStatus;
        if (mappedStatus === 'delivered') (order as any).deliveredAt = timestamp;
      }

      await order.save();
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Delhivery webhook]', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
