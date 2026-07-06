export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { syncThyrocareProducts } from '@/lib/services/productSync';

// Cron: nightly Thyrocare catalog refresh (prices, profiles, new/removed products).
// Runs WITHOUT any admin login — uses Thyrocare's own API key (env creds) via ThyrocareService.
// Refreshes thyrocareData (prices etc.), keeps customPricing/customImage, deactivates orphans.
//
// Schedule daily ~02:00 IST.
// VM crontab:  0 2 * * * curl -s -X POST -H "x-cron-secret: <CRON_SECRET>" http://localhost:3000/api/cron/sync-products
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const incoming = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
    if (incoming !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  try {
    await connectDB();
    const { synced, orphaned } = await syncThyrocareProducts('ALL');
    const elapsed = Date.now() - startTime;
    console.log(`[Cron] Product sync done in ${elapsed}ms — ${synced} synced, ${orphaned} orphaned`);
    return NextResponse.json({ success: true, synced, orphaned, elapsedMs: elapsed });
  } catch (err) {
    console.error('[Cron] Product sync error:', err);
    const message = err instanceof Error ? err.message : 'Product sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
