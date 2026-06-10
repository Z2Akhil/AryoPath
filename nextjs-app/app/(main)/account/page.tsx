'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/providers/UserProvider';
import {
    User, Edit3, Save, Phone, Mail,
    AlertCircle, CheckCircle, X, Loader,
    FlaskConical, Pill, Stethoscope, ChevronRight, ShoppingBag, ChevronDown,
} from 'lucide-react';

export default function AccountPage() {
    const { user, updateProfile, loading: userLoading } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [isEditing, setIsEditing]       = useState(false);
    const [ordersOpen, setOrdersOpen]     = useState(false);
    const [firstName, setFirstName]       = useState('');
    const [lastName, setLastName]         = useState('');
    const [email, setEmail]               = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [isSaving, setIsSaving]         = useState(false);

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

    if (!mounted || userLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader className="animate-spin text-blue-600 h-10 w-10" />
            </div>
        );
    }
    if (!user) return null;

    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-100 shrink-0">
                        <span className="text-white text-lg font-black">
                            {(user.firstName?.[0] || user.mobileNumber?.[0] || 'U').toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold text-gray-900">
                            {fullName || 'Hi there!'}
                        </h1>
                        <p className="text-sm text-gray-400">{user.mobileNumber}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-5 space-y-4">

                {/* My Profile */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" /> My Profile
                        </h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                        )}
                    </div>

                    <div className="px-4 py-4">
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
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Email <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isSaving}
                                        placeholder="your@email.com"
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
                                    { icon: User,  label: 'Name',   value: fullName || null },
                                    { icon: Phone, label: 'Mobile', value: user.mobileNumber },
                                    { icon: Mail,  label: 'Email',  value: email || null },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-gray-400 font-medium">{label}</p>
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

                {/* My Orders — expandable */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setOrdersOpen(o => !o)}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4.5 h-4.5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-gray-800">My Orders</p>
                            <p className="text-xs text-gray-400 mt-0.5">Lab tests & medicine deliveries</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${ordersOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {ordersOpen && (
                        <div className="border-t border-gray-50 divide-y divide-gray-50">
                            <Link
                                href="/orders?type=tests"
                                className="flex items-center gap-3 pl-8 pr-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <FlaskConical className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">Lab Tests</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Bookings & reports</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </Link>
                            <Link
                                href="/orders?type=medicines"
                                className="flex items-center gap-3 pl-8 pr-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Pill className="w-4 h-4 text-teal-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">Medicines</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Deliveries & tracking</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* My Appointments */}
                <Link
                    href="/account/appointments"
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm hover:bg-gray-50 active:bg-gray-100 active:scale-[0.99] transition-all"
                >
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4.5 h-4.5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">My Appointments</p>
                        <p className="text-xs text-gray-400 mt-0.5">Doctor consultations & meet links</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </Link>

            </div>
        </div>
    );
}
