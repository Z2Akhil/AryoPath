import { NextRequest, NextResponse } from 'next/server';
import { doctorAuth } from '@/lib/auth';
import Doctor from '@/lib/models/Doctor';

export async function GET(req: NextRequest) {
    const authResult = await doctorAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const doctor = await Doctor.findById(authResult.doctor._id).select('-loginPasswordHash -__v').lean();
    return NextResponse.json({ success: true, doctor });
}
