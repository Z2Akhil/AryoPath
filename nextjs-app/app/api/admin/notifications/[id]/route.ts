export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/models/Notification';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.NOTIFICATIONS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { id } = await params;

        const notification = await Notification.findById(id)
            .populate('createdBy', 'name')
            .populate('recipients.userId', 'firstName lastName email mobileNumber')
            .lean();

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            notification
        });

    } catch (error: any) {
        console.error('Fetch Notification Detail Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notification details' }, { status: 500 });
    }
}
