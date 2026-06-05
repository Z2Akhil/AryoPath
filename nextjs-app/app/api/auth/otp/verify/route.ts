import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';
import User from '@/lib/models/User';
import SMSService from '@/lib/services/smsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, otp, purpose = 'verification', verificationId } = body;

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const otpRecord = await OTP.findOne({
      mobileNumber,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request new OTP' },
        { status: 400 }
      );
    }

    // Always use MessageCentral validation
    const actualVerificationId = verificationId || otpRecord.verificationId;

    if (!actualVerificationId) {
      return NextResponse.json(
        { success: false, message: 'Verification ID not found' },
        { status: 400 }
      );
    }

    const validationResult = await SMSService.validateOTP(actualVerificationId, otp);

    if (!validationResult.success) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return NextResponse.json({
        success: false,
        message: validationResult.message,
        errorCode: validationResult.errorCode
      }, { status: 400 });
    }

    // MessageCentral validation successful
    otpRecord.isUsed = true;
    await otpRecord.save();

    let user;
    if (purpose === 'verification') {
      user = await User.findOneAndUpdate(
        { mobileNumber },
        { isVerified: true },
        { returnDocument: 'after' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: purpose === 'verification' && user ? {
        id: user._id,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
      } : undefined,
      purpose,
      provider: 'MessageCentral'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify OTP';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}