'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
    Mail,
    History,
    Send,
    Users,
    LayoutDashboard,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronRight,
    TrendingUp,
    Loader2
} from 'lucide-react';
import NotificationStats from '@/components/admin/notifications/NotificationStats';
import NotificationForm from '@/components/admin/notifications/NotificationForm';
import UserSelector from '@/components/admin/notifications/UserSelector';
import EmailPreview from '@/components/admin/notifications/EmailPreview';
import NotificationHistory from '@/components/admin/notifications/NotificationHistory';
import { adminNotificationApi } from '@/lib/api/adminNotificationApi';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

const NotificationsPage = () => {
    const { isAdmin, hasPermission } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    const [emailType, setEmailType] = useState('promotional');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [users, setUsers] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const res = await adminNotificationApi.getUsersForNotification(1, 100);
            if (res.success) {
                setUsers(res.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'compose' && users.length === 0) {
            fetchUsers();
        }
    }, [activeTab]);

    const handleSendNotification = async () => {
        // Add validation for content as well
        if (!subject.trim() || !content.trim() || selectedUsers.length === 0) {
            console.error('❌ Frontend validation failed:', {
                hasSubject: !!subject.trim(),
                hasContent: !!content.trim(),
                selectedCount: selectedUsers.length
            });
            return;
        }

        try {
            setSending(true);
            setError('');
            setSuccessMessage('');

            const notificationData = {
                subject: subject.trim(),
                content: content.trim(),
                emailType,
                userIds: selectedUsers.map(user => user._id)
            };

            console.log('📤 Frontend sending notification:', {
                subject: notificationData.subject.substring(0, 30),
                content: notificationData.content.substring(0, 30),
                emailType: notificationData.emailType,
                userIdsCount: notificationData.userIds.length
            });

            const response = await adminNotificationApi.sendNotification(notificationData);

            if (response.success) {
                setSuccessMessage(`Success! Notification queued for ${selectedUsers.length} recipients.`);
                setSubject('');
                setContent('');
                setSelectedUsers([]);

                // Auto-hide success message
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (err: any) {
            console.error('Error sending notification:', err);
            const message = err.response?.data?.error || err.message || 'Failed to send notification. Please try again.';
            setError(message);
        } finally {
            setSending(false);
        }
    };

    if (!isAdmin && !hasPermission(PERMISSIONS.NOTIFICATIONS_VIEW)) {
        return <AccessDenied section="Notifications" />;
    }

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100 mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                        </span>
                        Communication Hub
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
                        System Notifications
                    </h1>
                    <p className="text-gray-500 font-medium max-w-xl">
                        Compose and dispatch targeted messages to your users through our reliable delivery engine.
                    </p>
                </div>

                {/* Tab Switcher - Segmented Control Style */}
                <div className="bg-white border border-gray-100 p-1.5 rounded-[20px] shadow-sm flex min-w-[320px]">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[14px] text-sm font-bold transition-all duration-300 ${activeTab === 'compose'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Send className={`h-4 w-4 ${activeTab === 'compose' ? '' : 'text-gray-400'}`} />
                        Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-[14px] text-sm font-bold transition-all duration-300 ${activeTab === 'history'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <History className={`h-4 w-4 ${activeTab === 'history' ? '' : 'text-gray-400'}`} />
                        Delivery Logs
                    </button>
                </div>
            </div>

            {/* Stats Quick View */}
            <NotificationStats />

            {/* Success/Error Toasts */}
            {(successMessage || error) && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 ${successMessage ? 'bg-green-50 border-green-200 text-green-900 shadow-green-500/5' : 'bg-red-50 border-red-200 text-red-900 shadow-red-500/5'
                    }`}>
                    <div className={`p-2 rounded-xl border ${successMessage ? 'bg-green-100 border-green-200 text-green-600' : 'bg-red-100 border-red-200 text-red-600'}`}>
                        {successMessage ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-extrabold leading-none mb-0.5">{successMessage ? 'Transmission Success' : 'Delivery Error'}</p>
                        <p className="text-xs font-medium opacity-80">{successMessage || error}</p>
                    </div>
                </div>
            )}

            {/* Main Feature Content */}
            <div className="transition-all duration-500 ease-in-out">
                {activeTab === 'compose' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left: Compose Form */}
                        <div className="lg:col-span-7 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 space-y-8">
                            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-gray-900">Create Message</h2>
                                    <p className="text-sm font-medium text-gray-400">Draft your message content and type</p>
                                </div>
                            </div>

                            <NotificationForm
                                emailType={emailType}
                                setEmailType={setEmailType}
                                subject={subject}
                                setSubject={setSubject}
                                content={content}
                                setContent={setContent}
                                onPreview={() => setPreviewOpen(true)}
                            />
                        </div>

                        {/* Right: Recipient Selector */}
                        <div className="lg:col-span-5 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 flex flex-col h-full sticky top-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-extrabold text-gray-900">Recipients</h2>
                                        <p className="text-sm font-medium text-gray-400">Target specific user groups</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <UserSelector
                                    users={users}
                                    selectedUsers={selectedUsers}
                                    setSelectedUsers={setSelectedUsers}
                                    loading={usersLoading}
                                    onRefresh={fetchUsers}
                                />
                            </div>

                            {/* Primary Action Button */}
                            <div className="mt-8">
                                <button
                                    onClick={handleSendNotification}
                                    disabled={sending || selectedUsers.length === 0 || !subject.trim() || !content.trim()}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-extrabold text-base hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-400/20 active:scale-[0.98]"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Engaging Systems...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            Dispatch Notification
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* History View */
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 min-h-[600px]">
                        <NotificationHistory />
                    </div>
                )}
            </div>

            {/* Preview Overlay */}
            {previewOpen && (
                <EmailPreview
                    subject={subject}
                    content={content}
                    emailType={emailType}
                    recipientCount={selectedUsers.length}
                    onClose={() => setPreviewOpen(false)}
                />
            )}
        </div>
    );
};

export default NotificationsPage;
