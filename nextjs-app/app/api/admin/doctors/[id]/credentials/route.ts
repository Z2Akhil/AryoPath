import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminAuth } from '@/lib/auth';
import Doctor from '@/lib/models/Doctor';
import connectToDatabase from '@/lib/db/mongoose';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ _id: id, isDeleted: false });
    if (!doctor) {
        return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    const conflict = await Doctor.findOne({ loginUsername: username.toLowerCase(), _id: { $ne: id } });
    if (conflict) {
        return NextResponse.json({ success: false, error: 'Username already taken by another doctor' }, { status: 409 });
    }

    const loginPasswordHash = await bcrypt.hash(password, 12);
    await Doctor.findByIdAndUpdate(id, {
        loginUsername: username.toLowerCase(),
        loginPasswordHash,
        hasLogin: true,
    });

    return NextResponse.json({ success: true, message: 'Login credentials set', loginUsername: username.toLowerCase() });
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { id } = await params;
    const doctor = await Doctor.findOne({ _id: id, isDeleted: false });
    if (!doctor) {
        return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }

    await Doctor.findByIdAndUpdate(id, {
        $unset: { loginUsername: 1, loginPasswordHash: 1 },
        hasLogin: false,
    });

    return NextResponse.json({ success: true, message: 'Login access removed' });
}
