import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import ConsultationAppointment from '@/lib/models/ConsultationAppointment';

export const dynamic = 'force-dynamic';

function getUserId(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies.get('token')?.value ?? null);
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Hide on-behalf appointments that are still awaiting payment — the user should
    // only see them once the payment link is paid (webhook flips payment.status → 'paid').
    // Self-serve appointments are always paid before creation, so they're unaffected.
    const appointments = await ConsultationAppointment.find({
      userId,
      $or: [
        { bookedByAdmin: { $ne: true } },            // all self-serve bookings
        { 'payment.status': { $ne: 'pending' } },    // on-behalf that's paid / not_required
      ],
    })
      .sort({ appointmentDateTime: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('[GET /api/user/appointments] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
