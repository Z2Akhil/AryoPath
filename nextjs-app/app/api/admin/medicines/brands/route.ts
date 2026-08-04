import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Medicine from '@/lib/models/Medicine';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';

export const dynamic = 'force-dynamic';

// ─── GET /api/admin/medicines/brands ──────────────────────────────────────────
// Distinct company/manufacturer names, for the "Company" filter dropdown.
// `madeBy` is a free-text field, so values are de-duped case-insensitively and
// the first-seen spelling wins as the display label.
export async function GET(request: NextRequest) {
  const authResult = await adminOrStaffAuth(request, [PERMISSIONS.MEDICINES_VIEW, PERMISSIONS.PRESCRIPTION_BOOKING]);
  if (!authResult.authenticated) {
    return NextResponse.json({ success: false, message: authResult.error }, { status: authResult.status });
  }

  await connectToDatabase();

  const raw: string[] = await Medicine.distinct('madeBy', { madeBy: { $nin: ['', null] } });

  const seen = new Map<string, string>();
  for (const name of raw) {
    const label = String(name).trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!seen.has(key)) seen.set(key, label);
  }

  const brands = [...seen.values()].sort((a, b) => a.localeCompare(b));

  // Never cache — a company added seconds ago must show up on the next request.
  return NextResponse.json(
    { success: true, data: brands },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
