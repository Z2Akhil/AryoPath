import { NextRequest, NextResponse } from 'next/server';
import { staffAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const authResult = await staffAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const { staff } = authResult;
    return NextResponse.json({
        success: true,
        staff: {
            _id:         staff._id,
            username:    staff.username,
            name:        staff.name,
            email:       staff.email,
            mobile:      staff.mobile,
            permissions: staff.permissions,
            isActive:    staff.isActive,
            lastLogin:   staff.lastLogin,
            createdAt:   staff.createdAt,
            updatedAt:   staff.updatedAt,
        },
    });
}
