export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';
import { adminOrStaffAuth } from '@/lib/auth';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, 'users.view');
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;
    const { isActive } = await req.json();

    if (typeof isActive !== 'boolean') {
        return NextResponse.json({ success: false, error: 'isActive must be a boolean value' }, { status: 400 });
    }

    try {
        await dbConnect();

        const oldUser = await User.findById(userId).select('-password');
        if (!oldUser) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isActive, updatedAt: new Date() },
            { returnDocument: 'after' }
        ).select('-password');

        const responseTime = Date.now() - startTime;

        if (auth.role === 'admin') {
            await AdminActivity.logActivity({
                adminId: (auth as any).admin._id,
                sessionId: (auth as any).session._id,
                action: 'USERS_UPDATE',
                description: `Admin ${(auth as any).admin.name} changed status of user ${oldUser.email || userId} to ${isActive ? 'Active' : 'Inactive'}`,
                resource: 'users',
                resourceId: userId,
                endpoint: `/api/admin/users/${userId}/status`,
                method: 'PATCH',
                statusCode: 200,
                responseTime,
                metadata: { userId, oldStatus: oldUser.isActive, newStatus: isActive }
            });
        }

        return NextResponse.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: updatedUser,
            responseTime
        });

    } catch (error: any) {
        console.error('Toggle user status error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update user status' }, { status: 500 });
    }
}
