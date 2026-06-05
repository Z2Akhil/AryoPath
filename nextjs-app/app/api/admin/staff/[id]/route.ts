import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminAuth } from '@/lib/auth';
import Staff from '@/lib/models/Staff';
import connectToDatabase from '@/lib/db/mongoose';
import { ALL_PERMISSIONS, Permission } from '@/lib/constants/permissions';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const staff = await Staff.findById(id).select('-passwordHash').lean();
    if (!staff) {
        return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, staff });
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { name, email, mobile, permissions, isActive, password } = body;

    const updateData: Record<string, unknown> = {};
    if (name     !== undefined) updateData.name     = name;
    if (email    !== undefined) updateData.email    = email;
    if (mobile   !== undefined) updateData.mobile   = mobile;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (permissions !== undefined) {
        const invalidPerms = (permissions as string[]).filter(p => !ALL_PERMISSIONS.includes(p as Permission));
        if (invalidPerms.length > 0) {
            return NextResponse.json({ success: false, error: `Invalid permissions: ${invalidPerms.join(', ')}` }, { status: 400 });
        }
        updateData.permissions = permissions;
    }

    if (password !== undefined) {
        if (password.length < 8) {
            return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
        }
        updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const staff = await Staff.findByIdAndUpdate(id, updateData, { returnDocument: 'after' }).select('-passwordHash').lean();
    if (!staff) {
        return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, staff });
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) {
        return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff deleted' });
}
