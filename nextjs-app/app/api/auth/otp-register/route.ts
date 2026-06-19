import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import validator from 'validator';

// POST /api/auth/otp-register
// Complete registration for a new user after OTP has been verified via /api/auth/otp-login.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobileNumber, firstName, email } = body;

        if (!mobileNumber || !firstName?.trim()) {
            return NextResponse.json(
                { success: false, message: 'Mobile number and name are required' },
                { status: 400 }
            );
        }

        if (email && !validator.isEmail(email)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Verify that OTP was successfully validated within the last 15 minutes
        const cutoff = new Date(Date.now() - 15 * 60 * 1000);
        const verifiedOTP = await OTP.findOne({
            mobileNumber,
            purpose: 'login',
            isUsed: true,
            createdAt: { $gte: cutoff },
        }).sort({ createdAt: -1 });

        if (!verifiedOTP) {
            return NextResponse.json(
                { success: false, message: 'OTP verification expired. Please start over.' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser && existingUser.isVerified) {
            return NextResponse.json(
                { success: false, message: 'An account with this mobile number already exists.' },
                { status: 400 }
            );
        }

        if (email) {
            const emailTaken = await User.findOne({ email: email.toLowerCase() });
            if (emailTaken) {
                return NextResponse.json(
                    { success: false, message: 'Email is already in use by another account' },
                    { status: 400 }
                );
            }
        }

        // Split firstName into first + last on first space
        const nameParts = firstName.trim().split(/\s+/);
        const first = nameParts[0];
        const last = nameParts.slice(1).join(' ');

        let user;
        if (existingUser) {
            existingUser.firstName = first;
            existingUser.lastName = last;
            existingUser.isVerified = true;
            if (email) existingUser.email = email.toLowerCase();
            await existingUser.save();
            user = existingUser;
        } else {
            user = await User.create({
                firstName: first,
                lastName: last,
                mobileNumber,
                isVerified: true,
                ...(email ? { email: email.toLowerCase() } : {}),
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                isVerified: user.isVerified,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error('OTP register error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
