import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MedicineOrder from '@/lib/models/MedicineOrder';
import type { MedicineOrderStatus } from '@/types/medicineOrder';

// Maps Delhivery B2C webhook status strings → our order milestone status.
// Exact status values per Delhivery docs (forward shipment):
//   Manifested  → shipped   (order created in Delhivery system)
//   In Transit  → shipped
//   Dispatched  → out_for_delivery  (FE out for final delivery)
//   Delivered   → delivered
//   RTO         → cancelled (return to origin — undelivered)
function mapCourierStatus(courierStatus: string): MedicineOrderStatus | null {
  const s = courierStatus.toLowerCase().trim();
  if (s === 'delivered')                        return 'delivered';
  if (s === 'dispatched')                       return 'out_for_delivery';
  if (s === 'in transit' || s === 'manifested') return 'shipped';
  if (s === 'rto')                              return 'cancelled';
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

    // Delhivery scan push payload: { waybill, status, statusType, instructions, city, state, timestamp }
    // May arrive as a single object or wrapped in a packages/shipments array
    const packages: any[] = body?.packages ?? body?.shipments ?? (Array.isArray(body) ? body : [body]);

    await connectDB();

    for (const pkg of packages) {
      const awb = pkg?.waybill ?? pkg?.AWB ?? pkg?.awb;
      if (!awb) continue;

      const order = await MedicineOrder.findOne({ awb: String(awb) });
      if (!order) continue;

      const status    = pkg?.status ?? pkg?.Status ?? '';
      const statusType = pkg?.statusType ?? pkg?.status_type ?? '';
      const activity  = pkg?.instructions ?? pkg?.activity ?? '';
      const location  = pkg?.city ?? pkg?.City ?? pkg?.location ?? '';
      const timestamp = new Date(pkg?.timestamp ?? pkg?.status_time ?? Date.now());

      (order as any).courierStatus = status;
      (order as any).courierStatusUpdatedAt = new Date();

      const existing: any[] = (order as any).courierStatusHistory ?? [];
      const alreadyRecorded = existing.some(
        (e: any) => e.status === status && Math.abs(new Date(e.timestamp).getTime() - timestamp.getTime()) < 60000
      );
      if (!alreadyRecorded) {
        existing.unshift({ status, statusType, activity, location, timestamp });
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
