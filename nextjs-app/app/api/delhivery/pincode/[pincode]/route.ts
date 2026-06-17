export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkPincodeServiceable } from '@/lib/services/delhiveryService';

// Public: check if Delhivery delivers to a pincode (used on medicine checkout).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ pincode: string }> }) {
  const { pincode } = await params;

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ success: false, serviceable: false, error: 'Invalid pincode' }, { status: 400 });
  }

  try {
    const serviceable = await checkPincodeServiceable(pincode);
    return NextResponse.json({ success: true, serviceable });
  } catch {
    // On API failure, don't block the user — treat as unknown/serviceable.
    return NextResponse.json({ success: true, serviceable: true, fallback: true });
  }
}
