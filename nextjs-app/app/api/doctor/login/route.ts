import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Doctor from '@/lib/models/Doctor';
import connectToDatabase from '@/lib/db/mongoose';

export async function POST(req: NextRequest) {
    await connectToDatabase();
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const doctor = await Doctor.findOne({
        loginUsername: username.toLowerCase(),
        hasLogin: true,
        isDeleted: false,
        isActive: true,
    }).select('+loginPasswordHash');

    const isValid = doctor && await bcrypt.compare(password, doctor.loginPasswordHash!);
    if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
        { id: doctor._id.toString(), role: 'doctor' },
        process.env.JWT_SECRET!,
        { expiresIn: '12h' }
    );

    return NextResponse.json({
        success: true,
        token,
        doctor: {
            _id:            doctor._id,
            name:           doctor.name,
            specialization: doctor.specialization,
            profilePhoto:   doctor.profilePhoto,
            loginUsername:  doctor.loginUsername,
            slug:           doctor.slug,
        },
    });
}
