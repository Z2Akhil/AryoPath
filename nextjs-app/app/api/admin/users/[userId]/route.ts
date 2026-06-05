export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';
import { adminOrStaffAuth } from '@/lib/auth';
import validator from 'validator';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, 'users.view');
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;

    try {
        await dbConnect();

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const responseTime = Date.now() - startTime;

        // Activity log admin-only (staff has no session)
        if (auth.role === 'admin') {
            await AdminActivity.logActivity({
                adminId: (auth as any).admin._id,
                sessionId: (auth as any).session._id,
                action: 'USERS_VIEW',
                description: `Admin ${(auth as any).admin.name} viewed user ${user.email || userId}`,
                resource: 'users',
                resourceId: userId,
                endpoint: `/api/admin/users/${userId}`,
                method: 'GET',
                statusCode: 200,
                responseTime,
                metadata: { userId, userEmail: user.email }
            });
        }

        return NextResponse.json({ success: true, user, responseTime });

    } catch (error: any) {
        console.error('Get user details error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch user details' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, 'users.view');
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;
    const updateData = await req.json();

    try {
        await dbConnect();

        const oldUser = await User.findById(userId).select('-password');
        if (!oldUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (updateData.email && !validator.isEmail(updateData.email)) {
            return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
        }

        if (updateData.mobileNumber && !validator.isMobilePhone(updateData.mobileNumber, "any", { strictMode: false })) {
            return NextResponse.json({ success: false, error: 'Invalid mobile number' }, { status: 400 });
        }

        const sanitizedUpdateData = { ...updateData };
        delete sanitizedUpdateData.password;
        sanitizedUpdateData.updatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            sanitizedUpdateData,
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        const responseTime = Date.now() - startTime;

        if (auth.role === 'admin') {
            await AdminActivity.logActivity({
                adminId: (auth as any).admin._id,
                sessionId: (auth as any).session._id,
                action: 'USERS_UPDATE',
                description: `Admin ${(auth as any).admin.name} updated user ${oldUser.email || userId}`,
                resource: 'users',
                resourceId: userId,
                endpoint: `/api/admin/users/${userId}`,
                method: 'PUT',
                statusCode: 200,
                responseTime,
                metadata: { userId, changes: updateData }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser,
            responseTime
        });

    } catch (error: any) {
        console.error('Update user error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({ success: false, error: errors.join(', ') }, { status: 400 });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return NextResponse.json({ success: false, error: `${field} already exists` }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
    }
}
