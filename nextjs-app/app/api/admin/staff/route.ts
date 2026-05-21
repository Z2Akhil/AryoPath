import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminAuth } from '@/lib/auth';
import Staff from '@/lib/models/Staff';
import connectToDatabase from '@/lib/db/mongoose';
import { ALL_PERMISSIONS, Permission } from '@/lib/constants/permissions';

export async function GET(req: NextRequest) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip  = (page - 1) * limit;

    const [staff, total] = await Promise.all([
        Staff.find({}).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Staff.countDocuments({}),
    ]);

    return NextResponse.json({ success: true, staff, total, page, limit });
}

export async function POST(req: NextRequest) {
    const authResult = await adminAuth(req);
    if (!authResult.authenticated) {
        return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();
    const body = await req.json();
    const { username, password, name, email, mobile, permissions = [] } = body;

    if (!username || !password || !name || !email || !mobile) {
        return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const invalidPerms = (permissions as string[]).filter(p => !ALL_PERMISSIONS.includes(p as Permission));
    if (invalidPerms.length > 0) {
        return NextResponse.json({ success: false, error: `Invalid permissions: ${invalidPerms.join(', ')}` }, { status: 400 });
    }

    const existing = await Staff.findOne({ username: username.toLowerCase() });
    if (existing) {
        return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const staff = await Staff.create({
        username: username.toLowerCase(),
        passwordHash,
        name,
        email,
        mobile,
        permissions,
        createdBy: authResult.admin._id,
    });

    const result = staff.toObject();
    delete (result as any).passwordHash;

    return NextResponse.json({ success: true, staff: result }, { status: 201 });
}
