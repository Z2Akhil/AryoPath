import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';

export const dynamic = 'force-dynamic';

// ─── Thyrocare status → AyroPath outer status mapping ────────────────────────
// Only terminal states flip the outer Order.status.
// Intermediate states keep Order.status as 'CREATED' (already in progress).
function mapToOuterStatus(thyrocareStatus: string): 'CREATED' | 'COMPLETED' | 'CANCELLED' | null {
    switch (thyrocareStatus) {
        case 'DONE':
        case 'REPORTED':
            return 'COMPLETED';
        case 'CANCELLED':
            return 'CANCELLED';
        default:
            return 'CREATED'; // All in-progress statuses
    }
}

// ─── User-facing display label ─────────────────────────────────────────────
const DISPLAY_LABELS: Record<string, string> = {
    'YET TO ASSIGN':        'Order Booked',
    'Y':                    'Order Booked',
    'ASSIGNED':             'Technician Assigned',
    'ACCEPTED':             'Technician Accepted',
    'STARTED':              'Technician On the Way',
    'ARRIVED':              'Technician Arrived',
    'CONFIRMED':            'Sample Collected',
    'SERVICED':             'Sample at Lab',
    'PARTIAL SERVICED':     'Partially Serviced',
    'RESCHEDULED':          'Appointment Rescheduled',
    'FIX APPOINTMENT':      'Appointment Fixed',
    'DONE':                 'Report Ready',
    'REPORTED':             'Report Released',
    'CANCELLED':            'Cancelled',
    'CANCELLATIONREQUEST':  'Cancellation Requested',
    'CANCELTEST':           'Cancellation Initiated',
    'PERSUASION':           'Follow-up in Progress',
    'CALLBACK':             'Callback Requested',
    'CHARBI PUSHED':        'Assigned to Partner Technician',
    'RELEASED':             'Technician Released',
    'REQUEST TO RELEASE':   'Release Requested',
    'LAB':                  'Sample at Lab',
};

// ─── Core processing — runs AFTER 200 is sent ─────────────────────────────
async function processThyrocareWebhook(body: any): Promise<void> {
    try {
        await connectDB();

        // Thyrocare sends: orderId (VLXXXXXX), orderStatus, orderStatusDescription, orderData, timestamp
        const thyrocareOrderNo: string = body.orderId || body.orderNo || body.order_no || '';
        const rawStatus: string        = body.orderStatus || body.status || '';

        if (!thyrocareOrderNo || !rawStatus) {
            console.warn('[Thyrocare webhook] Missing orderId or orderStatus in payload');
            return;
        }

        // Normalize to uppercase + trim so DB comparisons are consistent
        const normalizedStatus = rawStatus.toUpperCase().trim();
        const displayStatus    = DISPLAY_LABELS[normalizedStatus] ?? normalizedStatus;

        const order = await Order.findOne({ 'thyrocare.orderNo': thyrocareOrderNo });
        if (!order) {
            console.warn(`[Thyrocare webhook] Order not found for Thyrocare order no: ${thyrocareOrderNo}`);
            return;
        }

        // Skip if status is unchanged (avoid duplicate history entries)
        const currentStatus = (order.thyrocare.status || '').toUpperCase().trim();
        if (currentStatus === normalizedStatus) {
            console.log(`[Thyrocare webhook] Status unchanged (${normalizedStatus}) for ${thyrocareOrderNo}, skipping.`);
            return;
        }

        // Capture before update for logging
        const previousStatus = order.thyrocare.status;

        // Update thyrocare sub-doc
        order.thyrocare.status = normalizedStatus;
        order.thyrocare.statusHistory.push({
            status:    normalizedStatus,
            timestamp: new Date(),
            notes:     `Webhook push — ${body.orderStatusDescription || normalizedStatus}`,
        });
        order.thyrocare.lastSyncedAt = new Date();

        // Store full orderData payload for reference/debugging
        if (body.orderData) {
            order.thyrocare.response = body.orderData;
        }

        // Flip outer Order.status
        const outerStatus = mapToOuterStatus(normalizedStatus);
        if (outerStatus) {
            order.status = outerStatus;
        }

        // If report is ready, extract report URLs from orderData.benMaster
        if (['DONE', 'REPORTED'].includes(normalizedStatus)) {
            const benMaster: any[] = body.orderData?.benMaster ?? [];
            for (const ben of benMaster) {
                if (ben.url) {
                    await (order as any).addReport(ben.name, ben.id, ben.url);
                }
            }
        }

        await order.save();

        console.log(
            `[Thyrocare webhook] ✅ ${thyrocareOrderNo}: ${previousStatus} → ${normalizedStatus} (${displayStatus})`
        );
    } catch (err) {
        console.error('[Thyrocare webhook] processThyrocareWebhook error:', err);
    }
}

// ─── Route handler ──────────────────────────────────────────────────────────
// Thyrocare requirement: Must respond within 1 second with HTTP 200
// and body { "respId": "RES00001", "response": "Success" }
export async function POST(req: NextRequest) {
    try {
        // Optional static auth header — set THYROCARE_WEBHOOK_SECRET in .env
        // to restrict to only Thyrocare's IP range (ask Thyrocare for their header name)
        const secret = process.env.THYROCARE_WEBHOOK_SECRET;
        if (secret) {
            const incomingSecret =
                req.headers.get('x-thyrocare-secret') ??
                req.headers.get('authorization') ??
                req.nextUrl.searchParams.get('secret');
            if (incomingSecret !== secret) {
                // Return 200 anyway — Thyrocare retries on non-200, which floods the endpoint
                console.warn('[Thyrocare webhook] Invalid secret received');
                return NextResponse.json({ respId: 'RES00001', response: 'Success' });
            }
        }

        const body = await req.json().catch(() => ({}));

        // Fire-and-forget: DB processing runs asynchronously so Thyrocare
        // gets the 200 response immediately (within 1s requirement).
        // Using a plain Promise instead of after() for compatibility with
        // self-hosted Node.js (Hostinger VM + pm2) where after() may not execute.
        processThyrocareWebhook(body).catch(err =>
            console.error('[Thyrocare webhook] Background processing error:', err)
        );

        // Thyrocare expects exactly this response format
        return NextResponse.json({ respId: 'RES00001', response: 'Success' });
    } catch (err) {
        console.error('[Thyrocare webhook] Route error:', err);
        // Always return 200 to prevent Thyrocare retry storms
        return NextResponse.json({ respId: 'RES00001', response: 'Success' });
    }
}
