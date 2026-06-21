import { NextRequest, NextResponse, after } from 'next/server';
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

interface NormalizedScan {
  awb: string;
  status: string;
  statusType: string;
  activity: string;
  location: string;
  timestamp: Date;
}

// Normalises a single scan from Delhivery into a flat shape.
// Handles the DEFAULT nested payload  { Shipment: { Status: { Status, StatusType, StatusLocation, Instructions, StatusDateTime }, AWB } }
// AND legacy/custom flat payloads     { waybill, status, instructions, city, timestamp }.
function normalizeScan(pkg: any): NormalizedScan | null {
  if (!pkg || typeof pkg !== 'object') return null;

  // Default payload wraps everything under "Shipment".
  const shp = pkg.Shipment ?? pkg.shipment ?? pkg;

  // Status may be a nested object (default) or a flat string (custom).
  const statusObj = shp.Status && typeof shp.Status === 'object' ? shp.Status : null;

  const awbRaw =
    shp.AWB ?? shp.awb ?? shp.waybill ??
    pkg.AWB ?? pkg.awb ?? pkg.waybill;
  if (!awbRaw) return null;

  const status =
    statusObj?.Status ??
    (typeof shp.Status === 'string' ? shp.Status : undefined) ??
    shp.status ?? pkg.status ?? '';

  const statusType =
    statusObj?.StatusType ?? shp.StatusType ?? pkg.statusType ?? pkg.status_type ?? '';

  const activity =
    statusObj?.Instructions ?? shp.Instructions ?? pkg.instructions ?? pkg.activity ?? '';

  const location =
    statusObj?.StatusLocation ?? shp.StatusLocation ?? pkg.city ?? pkg.City ?? pkg.location ?? '';

  const tsRaw =
    statusObj?.StatusDateTime ?? shp.StatusDateTime ?? pkg.timestamp ?? pkg.status_time ?? shp.PickUpDate;
  const parsed = tsRaw ? new Date(tsRaw) : new Date();
  const timestamp = isNaN(parsed.getTime()) ? new Date() : parsed;

  return {
    awb: String(awbRaw),
    status: String(status),
    statusType: String(statusType),
    activity: String(activity),
    location: String(location),
    timestamp,
  };
}

// Delhivery pushes status updates here.
// Applies all scans to their orders. Runs AFTER the 200 response is sent
// (via Next.js `after()`), so Delhivery never waits on DB work — keeps P99 low
// and avoids the 500 ms timeout that would make them drop scans.
async function processScans(rawPackages: any[]): Promise<void> {
  try {
    await connectDB();

    for (const pkg of rawPackages) {
      const scan = normalizeScan(pkg);
      if (!scan || !scan.awb) continue;

      const { awb, status, statusType, activity, location, timestamp } = scan;

      // Check for duplicate scan (same status within 60 s) without loading the full doc.
      // `as any` — CourierEvent.timestamp is string in the TS interface (JSON serialisation)
      // but the Mongoose schema stores Date; the query is correct at runtime.
      const existing = await MedicineOrder.findOne(
        { awb, 'courierStatusHistory.status': status,
          'courierStatusHistory.timestamp': { $gte: new Date(timestamp.getTime() - 60000), $lte: new Date(timestamp.getTime() + 60000) } } as any,
        { _id: 1 }
      );

      const $set: Record<string, any> = {
        courierStatus: status,
        courierStatusUpdatedAt: new Date(),
      };

      const mappedStatus = mapCourierStatus(status);
      if (mappedStatus) {
        $set.status = mappedStatus;
        if (mappedStatus === 'delivered') $set.deliveredAt = timestamp;
      }

      const update: Record<string, any> = { $set };

      // Only push to history if this exact scan isn't already recorded.
      if (!existing) {
        update.$push = {
          courierStatusHistory: {
            $each: [{ status, statusType, activity, location, timestamp }],
            $position: 0,
          },
        };
      }

      // updateOne bypasses full Mongoose validation — we only touch courier fields.
      const result = await MedicineOrder.updateOne({ awb }, update);
      if (result.matchedCount === 0) {
        console.warn(`[Delhivery webhook] No order found for AWB: ${awb}`);
      }
    }
  } catch (err) {
    console.error('[Delhivery webhook] processScans error:', err);
  }
}

// Register this URL in the Delhivery seller dashboard as the webhook endpoint.
// Responds 200 immediately, then processes scans asynchronously via after().
export async function POST(req: NextRequest) {
  try {
    // Verify shared secret from Delhivery (fast, before responding)
    const secret = process.env.DELHIVERY_WEBHOOK_SECRET;
    if (secret) {
      const incomingSecret = req.headers.get('x-delhivery-secret') ?? req.nextUrl.searchParams.get('secret');
      if (incomingSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    // May arrive as a single object (default { Shipment: {...} }) or wrapped in a packages/shipments array.
    const rawPackages: any[] = body?.packages ?? body?.shipments ?? (Array.isArray(body) ? body : [body]);

    // Heavy DB work runs AFTER the response is flushed — Delhivery gets 200 instantly.
    after(() => processScans(rawPackages));

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Delhivery webhook]', err);
    // Body parse failed — still return 200 so Delhivery doesn't retry a malformed push.
    return NextResponse.json({ received: true });
  }
}
