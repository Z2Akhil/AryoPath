export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { OrderStatusSyncService } from '@/lib/services/orderStatusSync';

// Cron job: auto-syncs all active lab orders with Thyrocare every 30 min
// Fallback for missed webhook events.
// Vercel: add to vercel.json crons array, schedule "0,30 * * * *"
// External: POST https://ayropath.com/api/cron/sync-lab-orders
//           Header: x-cron-secret: <CRON_SECRET>
export async function POST(req: NextRequest) {
    // Verify cron secret — prevents unauthorized triggers
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const incomingSecret =
            req.headers.get('x-cron-secret') ??
            req.nextUrl.searchParams.get('secret');

        if (incomingSecret !== secret) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
    }

    const startTime = Date.now();

    try {
        await connectDB();

        console.log('[Cron] Starting lab order status sync...');
        const result = await OrderStatusSyncService.syncAllOrdersStatus();

        const elapsed = Date.now() - startTime;
        console.log(`[Cron] Lab order sync done in ${elapsed}ms — ${result.total} checked, ${result.statusChanged} updated`);

        return NextResponse.json({
            success:       true,
            message:       'Lab order status sync completed',
            elapsedMs:     elapsed,
            total:         result.total,
            successful:    result.successful,
            failed:        result.failed,
            statusChanged: result.statusChanged,
        });
    } catch (error: any) {
        console.error('[Cron] Lab order sync error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Sync failed' },
            { status: 500 }
        );
    }
}

// Also support GET for easy testing from browser
export async function GET(req: NextRequest) {
    return POST(req);
}
