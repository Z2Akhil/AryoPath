import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Staff from '@/lib/models/Staff';
import connectToDatabase from '@/lib/db/mongoose';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const staff = await Staff.findOne({ username: username.toLowerCase() }).select('+passwordHash');

    const isValid = staff && staff.isActive && await staff.verifyPassword(password);
    if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    await Staff.findByIdAndUpdate(staff._id, { lastLogin: new Date() });

    const token = jwt.sign(
        { id: staff._id.toString(), role: 'staff' },
        process.env.JWT_SECRET!,
        { expiresIn: '8h' }
    );

    return NextResponse.json({
        success: true,
        token,
        staff: {
            _id:         staff._id,
            username:    staff.username,
            name:        staff.name,
            email:       staff.email,
            mobile:      staff.mobile,
            permissions: staff.permissions,
            isActive:    staff.isActive,
        },
    });
}
