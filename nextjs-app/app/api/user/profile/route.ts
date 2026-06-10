import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';

// Helper to get user from token
const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && user.isVerified) {
            return user;
        }
    } catch {
        // Invalid token
    }
    return null;
};

// GET /api/user/profile - Get user profile
export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                address: user.address,
                city: user.city,
                state: user.state,
                isVerified: user.isVerified,
                
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        console.error('Profile fetch error:', error);
        const message = error instanceof Error ? error.message : 'Server error while fetching profile';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}

// PUT /api/user/profile - Update user profile
export async function PUT(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { firstName, lastName, email, mobileNumber, address, city, state } = await req.json();

        console.log('User Profile Update - Request received:', {
            userId: user._id,
            updates: { firstName, lastName, email, mobileNumber, address, city, state }
        });

        // Validate email if provided
        if (email && !validator.isEmail(email)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Validate mobile number if provided
        if (mobileNumber !== undefined) {
            if (!validator.isMobilePhone(mobileNumber, "any", { strictMode: false })) {
                return NextResponse.json(
                    { success: false, message: 'Invalid mobile number format' },
                    { status: 400 }
                );
            }

            // Check for duplicate mobile number (excluding current user)
            const existingUser = await User.findOne({
                mobileNumber,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return NextResponse.json(
                    { success: false, message: 'Mobile number already in use by another account' },
                    { status: 400 }
                );
            }
        }

        // Validate firstName and lastName if provided
        if (firstName !== undefined && (!firstName.trim() || firstName.trim().length > 50)) {
            return NextResponse.json(
                { success: false, message: 'First name must be between 1 and 50 characters' },
                { status: 400 }
            );
        }

        if (lastName !== undefined && (!lastName.trim() || lastName.trim().length > 50)) {
            return NextResponse.json(
                { success: false, message: 'Last name must be between 1 and 50 characters' },
                { status: 400 }
            );
        }

        // Build update data
        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName.trim();
        if (lastName !== undefined) updateData.lastName = lastName.trim();

        // Email update logic
        if (email !== undefined) {
            const currentUser = await User.findById(user._id);
            if (email !== currentUser?.email) {
                // Check if email is unique
                const emailExists = await User.findOne({
                    email: email.toLowerCase(),
                    _id: { $ne: user._id }
                });

                if (emailExists) {
                    return NextResponse.json(
                        { success: false, message: 'Email already in use by another account' },
                        { status: 400 }
                    );
                }

                updateData.email = email.toLowerCase();
                // Reset email verification status if email changes
            }
        }

        if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { ...updateData, updatedAt: new Date() },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                mobileNumber: updatedUser.mobileNumber,
                email: updatedUser.email,
                address: updatedUser.address,
                city: updatedUser.city,
                state: updatedUser.state,
                isVerified: updatedUser.isVerified,
                
                createdAt: updatedUser.createdAt
            }
        });

    } catch (error: any) {
        console.error('Profile update error:', error);

        // Handle validation errors from Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                { success: false, message: errors.join(', ') },
                { status: 400 }
            );
        }

        // Handle duplicate key error (mobileNumber unique constraint)
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'Mobile number already in use by another account' },
                { status: 400 }
            );
        }

        const message = error instanceof Error ? error.message : 'Server error while updating profile';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
