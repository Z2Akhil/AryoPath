export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/models/Notification';
import AdminActivity from '@/lib/models/AdminActivity';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        const startTime = Date.now();

        const notification = await Notification.findById(id);

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        const failedRecipients = notification.recipients.filter((r: any) => r.status === 'failed');

        if (failedRecipients.length === 0) {
            return NextResponse.json({ success: false, error: 'No failed recipients to retry' }, { status: 400 });
        }

        // Actually send emails using the email service
        const emailService = (await import('@/lib/services/emailService')).default;

        const sendResults = await Promise.allSettled(
            failedRecipients.map(async (recipient: any) => {
                const result = await emailService.sendNotificationEmail(
                    recipient.email,
                    notification.subject,
                    notification.content,
                    notification.emailType || 'promotional'
                );
                return {
                    userId: recipient.userId,
                    email: recipient.email,
                    success: result.success,
                    messageId: (result as any).messageId,
                    error: result.error
                };
            })
        );

        // Process results and update recipients
        let newSentCount = 0;
        let newFailedCount = 0;

        const updatedRecipients = notification.recipients.map((recipient: any) => {
            if (recipient.status !== 'failed') return recipient;

            const resultIndex = failedRecipients.findIndex((fr: any) => fr.userId.toString() === recipient.userId.toString());
            if (resultIndex === -1) return recipient;

            const sendResult = sendResults[resultIndex];
            if (sendResult.status === 'fulfilled' && sendResult.value.success) {
                newSentCount++;
                return {
                    ...recipient.toObject ? recipient.toObject() : recipient,
                    status: 'sent',
                    sentAt: new Date(),
                    messageId: sendResult.value.messageId,
                    error: null
                };
            } else {
                newFailedCount++;
                const errorMsg = sendResult.status === 'rejected'
                    ? sendResult.reason?.message
                    : sendResult.value?.error;
                return {
                    ...recipient.toObject ? recipient.toObject() : recipient,
                    status: 'failed',
                    error: errorMsg || 'Retry failed'
                };
            }
        });

        // Determine final notification status
        const totalDelivered = notification.deliveredCount + newSentCount;
        const totalFailed = (notification.failedCount - failedRecipients.length) + newFailedCount;

        let finalStatus: 'completed' | 'partial' | 'failed';
        if (totalDelivered === notification.totalRecipients) {
            finalStatus = 'completed';
        } else if (totalDelivered > 0) {
            finalStatus = 'partial';
        } else {
            finalStatus = 'failed';
        }

        // Update the notification with results
        notification.recipients = updatedRecipients as any;
        notification.deliveredCount = totalDelivered;
        notification.failedCount = totalFailed;
        notification.status = finalStatus;
        notification.completedAt = new Date();
        await notification.save();

        const responseTime = Date.now() - startTime;

        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'NOTIFICATIONS_RETRY',
            description: `Retried failed deliveries for notification: "${notification.subject}" (${failedRecipients.length} users)`,
            resource: 'notifications',
            resourceId: id,
            endpoint: `/api/admin/notifications/${id}/retry-failed`,
            method: 'POST',
            statusCode: 200,
            responseTime,
            metadata: { notificationId: id, retryCount: failedRecipients.length }
        });

        return NextResponse.json({
            success: true,
            message: `Retry initiated for ${failedRecipients.length} failed recipients`
        });

    } catch (error: any) {
        console.error('Retry Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to initiate retry' }, { status: 500 });
    }
}
