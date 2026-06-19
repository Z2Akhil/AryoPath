import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import SMSService from '@/lib/services/smsService';
import jwt from 'jsonwebtoken';

// POST /api/auth/otp-login
// Verify OTP (purpose: 'login').
// Existing user → JWT.
// New user → auto-create with placeholder name, return JWT + isNewUser:true
//   (client shows "complete your profile" nudge; user fills name/email from account page).
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mobileNumber, otp, verificationId } = body;

        if (!mobileNumber || !otp) {
            return NextResponse.json(
                { success: false, message: 'Mobile number and OTP are required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const otpRecord = await OTP.findOne({
            mobileNumber,
            purpose: 'login',
            isUsed: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired OTP. Please request a new one.' },
                { status: 400 }
            );
        }

        if (otpRecord.attempts >= 3) {
            return NextResponse.json(
                { success: false, message: 'Too many failed attempts. Please request a new OTP.' },
                { status: 400 }
            );
        }

        const actualVerificationId = verificationId || otpRecord.verificationId;
        if (!actualVerificationId) {
            return NextResponse.json(
                { success: false, message: 'Verification ID not found. Please request a new OTP.' },
                { status: 400 }
            );
        }

        const validationResult = await SMSService.validateOTP(actualVerificationId, otp);

        if (!validationResult.success) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return NextResponse.json(
                { success: false, message: validationResult.message },
                { status: 400 }
            );
        }

        otpRecord.isUsed = true;
        await otpRecord.save();

        let user = await User.findOne({ mobileNumber, isActive: true });
        let isNewUser = false;

        if (!user) {
            // New user — auto-create with 'User' placeholder. Name/email collected later from account page.
            isNewUser = true;
            user = await User.create({
                firstName: 'User',
                mobileNumber,
                isVerified: true,
            });
        } else if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        return NextResponse.json({
            success: true,
            isNewUser,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        console.error('OTP login error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
