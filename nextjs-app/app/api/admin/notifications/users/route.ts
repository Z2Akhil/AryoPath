export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.NOTIFICATIONS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const skip = (page - 1) * limit;

        // Build query
        const query: any = { isActive: true }; // Only show active users by default
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('firstName lastName email mobileNumber profilePic role')
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            data: users.map((u: any) => ({
                _id: u._id,  // Use _id for consistency with MongoDB and frontend
                id: u._id,   // Keep id for backward compatibility
                name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
                email: u.email,
                mobile: u.mobileNumber,
                role: u.role || 'user',
                avatar: u.profilePic
            })),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Fetch Users for Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
    }
}
