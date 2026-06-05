export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import Staff from '@/lib/models/Staff';

export async function GET(req: NextRequest) {
    const auth = await adminAuth(req);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));

        // Aggregate orders booked by staff, count + list users
        const rankings = await Order.aggregate([
            { $match: { staffId: { $ne: null, $exists: true }, status: { $nin: ['FAILED', 'CANCELLED'] } } },
            {
                $group: {
                    _id: '$staffId',
                    totalBookings: { $sum: 1 },
                    userIds: { $addToSet: '$userId' },
                    lastBookingAt: { $max: '$createdAt' },
                    packages: { $push: '$package.name' },
                },
            },
            { $sort: { totalBookings: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'staffs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staff',
                },
            },
            { $unwind: { path: '$staff', preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userIds',
                    foreignField: '_id',
                    as: 'users',
                },
            },
            {
                $project: {
                    _id: 0,
                    staffId: '$_id',
                    name: '$staff.name',
                    email: '$staff.email',
                    mobile: '$staff.mobile',
                    isActive: '$staff.isActive',
                    totalBookings: 1,
                    lastBookingAt: 1,
                    uniqueUsers: { $size: '$userIds' },
                    users: {
                        $map: {
                            input: { $slice: ['$users', 5] },
                            as: 'u',
                            in: {
                                _id: '$$u._id',
                                name: { $concat: ['$$u.firstName', ' ', '$$u.lastName'] },
                                mobile: '$$u.mobileNumber',
                            },
                        },
                    },
                },
            },
        ]);

        return NextResponse.json({ success: true, data: rankings });
    } catch (err) {
        console.error('[Staff rankings]', err);
        return NextResponse.json({ success: false, error: 'Failed to fetch rankings' }, { status: 500 });
    }
}
