export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, PERMISSIONS.USERS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get('search') || '';
    const status   = searchParams.get('status');
    const verified = searchParams.get('verified');
    const page     = parseInt(searchParams.get('page') || '1');
    const limit    = parseInt(searchParams.get('limit') || '20');

    try {
        await dbConnect();

        const query: any = {};

        if (search) {
            query.$or = [
                { firstName:    { $regex: search, $options: 'i' } },
                { lastName:     { $regex: search, $options: 'i' } },
                { email:        { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'active')        query.isActive = true;
        else if (status === 'inactive') query.isActive = false;

        if (verified !== null && verified !== undefined) {
            query.emailVerified = verified === 'true';
        }

        const skip = (page - 1) * limit;

        const [users, totalCount] = await Promise.all([
            User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(query)
        ]);

        const responseTime = Date.now() - startTime;

        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) {
            await AdminActivity.logActivity({
                adminId,
                sessionId,
                action: 'USERS_SEARCH',
                description: `Searched users with pattern: ${search}`,
                resource: 'users',
                endpoint: '/api/admin/users/search',
                method: 'GET',
                statusCode: 200,
                responseTime,
                metadata: { search, status, verified, page, limit, count: users.length }
            });
        }

        return NextResponse.json({
            success: true,
            users,
            pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
            responseTime
        });

    } catch (error: any) {
        console.error('Search users error:', error);
        return NextResponse.json({ success: false, error: 'Failed to search users' }, { status: 500 });
    }
}
