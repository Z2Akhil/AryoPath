'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';
import {
    User, Edit3, Save, Phone, Loader,
    Mail, AlertCircle, CheckCircle, X,
    TrendingUp, Activity, ChevronRight, FileText, Stethoscope, Pill, FlaskConical,
} from 'lucide-react';
import { fetchUserOrders, type Order } from '@/lib/api/ordersApi';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import dynamic from 'next/dynamic';

const ManageAddresses = dynamic(() => import('@/components/account/ManageAddresses'), { ssr: false });

export default function AccountPage() {
    const { user, updateProfile, loading: userLoading } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Profile state
    const [isEditing, setIsEditing] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Orders summary
    const [orders, setOrders]       = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [medOrderCount, setMedOrderCount] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        if (!userLoading && !user) router.replace('/');
    }, [user, userLoading, router]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                setOrdersLoading(true);
                const [labData, medData] = await Promise.allSettled([
                    fetchUserOrders(),
                    medicineOrderApi.getUserOrders(1, 1),
                ]);
                if (labData.status === 'fulfilled') setOrders(labData.value || []);
                if (medData.status === 'fulfilled' && medData.value.success)
                    setMedOrderCount(medData.value.pagination.total);
            } catch { /* summary only — silent fail */ }
            finally { setOrdersLoading(false); }
        };
        load();
    }, [user]);

    const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileError(''); setProfileSuccess(''); setIsSaving(true);
        try {
            const result = await updateProfile({ firstName, lastName, email: email || undefined });
            if (result.success) { setProfileSuccess('Profile updated!'); setIsEditing(false); }
            else setProfileError(result.message || 'Failed to update.');
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : 'Failed to update.');
        } finally { setIsSaving(false); }
    };

    const handleCancel = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEmail(user?.email || '');
        setIsEditing(false); setProfileError(''); setProfileSuccess('');
    };

    // Derived stats
    const totalSpent = orders.reduce((s, o) => s + (o.payment?.amount || o.package?.price || 0), 0);
    const activeCount = orders.filter(o => !['DONE', 'REPORTED', 'CANCELLED', 'FAILED', 'COMPLETED'].includes((o.status || '').toUpperCase())).length;
    const completedCount = orders.filter(o => ['DONE', 'REPORTED', 'COMPLETED'].includes((o.status || '').toUpperCase())).length;

    if (!mounted || userLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader className="animate-spin text-blue-600 h-10 w-10" />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-gray-900">Hi, {user.firstName}!</h1>
                            <p className="text-sm text-gray-500">{user.mobileNumber}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

                {/* Orders — two cards side by side */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Lab Tests */}
                    <Link
                        href="/orders?type=tests"
                        className="block bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-lg shadow-blue-100 text-white hover:from-blue-700 hover:to-blue-800 transition-all active:scale-[0.98]"
                    >
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                            <FlaskConical className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-0.5">Lab Tests</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black">{ordersLoading ? '–' : orders.length}</p>
                            <ChevronRight className="w-4 h-4 text-blue-300 mb-1" />
                        </div>
                        {!ordersLoading && (
                            <p className="text-xs text-blue-200 mt-1">{activeCount} active</p>
                        )}
                    </Link>

                    {/* Medicines */}
                    <Link
                        href="/orders?type=medicines"
                        className="block bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-4 shadow-lg shadow-teal-100 text-white hover:from-teal-700 hover:to-teal-800 transition-all active:scale-[0.98]"
                    >
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                            <Pill className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-0.5">Medicines</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-black">{ordersLoading ? '–' : (medOrderCount ?? 0)}</p>
                            <ChevronRight className="w-4 h-4 text-teal-300 mb-1" />
                        </div>
                        <p className="text-xs text-teal-200 mt-1">orders placed</p>
                    </Link>
                </div>

                {/* Lab test quick-filter links */}
                {!ordersLoading && orders.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Active',    count: activeCount,    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100',   tab: 'active' },
                            { label: 'Completed', count: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tab: 'completed' },
                            { label: 'Cancelled', count: orders.filter(o => ['CANCELLED','FAILED'].includes((o.status||'').toUpperCase())).length, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', tab: 'cancelled' },
                        ].map(({ label, count, color, bg, border, tab }) => (
                            <Link key={tab} href={`/orders?type=tests&tab=${tab}`}
                                className={`${bg} ${border} border rounded-2xl px-4 py-3.5 flex flex-col items-center text-center hover:opacity-80 transition-opacity active:scale-[0.97]`}>
                                <p className={`text-2xl font-black ${color}`}>{count}</p>
                                <p className={`text-xs font-semibold ${color} mt-0.5`}>{label}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Profile card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" /> My Profile
                        </h2>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                        )}
                    </div>

                    <div className="px-4 sm:px-5 py-4">
                        {profileError && (
                            <div className="mb-3 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {profileError}
                            </div>
                        )}
                        {profileSuccess && (
                            <div className="mb-3 p-3 bg-emerald-50 rounded-xl flex items-center gap-2 text-emerald-600 text-xs">
                                <CheckCircle className="w-4 h-4 shrink-0" /> {profileSuccess}
                            </div>
                        )}

                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">First Name</label>
                                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={isSaving}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name</label>
                                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} disabled={isSaving}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isSaving} placeholder="your@email.com"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="submit" disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isSaving ? 'Saving…' : 'Save'}
                                    </button>
                                    <button type="button" onClick={handleCancel} disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                {[
                                    { icon: User, label: 'Name', value: [firstName, lastName].filter(Boolean).join(' ') || '—' },
                                    { icon: Phone, label: 'Mobile', value: user.mobileNumber },
                                    { icon: Mail, label: 'Email', value: email || null },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-gray-400 font-medium">{label}</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {value || <span className="text-gray-400 font-normal italic text-xs">Not added</span>}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* My Appointments card */}
                <Link
                    href="/account/appointments"
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">My Appointments</p>
                            <p className="text-xs text-gray-400 mt-0.5">Doctor consultations & meet links</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>

                {/* Addresses */}
                <ManageAddresses />


            </div>
        </div>
    );
}
