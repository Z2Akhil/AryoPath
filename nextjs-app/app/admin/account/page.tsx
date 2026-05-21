'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';
import {
    User,
    Mail,
    Phone,
    ShieldCheck,
    Clock,
    LogOut,
    BadgeCheck,
    ShieldAlert,
    CalendarDays,
    Activity
} from 'lucide-react';

const AccountPage = () => {
    const { user, logout, isAdmin } = useAdminAuth();

    const adminProfile = {
        name: user?.adminProfile?.name || 'System Administrator',
        email: user?.adminProfile?.email || 'admin@ayropath.com',
        mobile: user?.adminProfile?.mobile || 'Not provided',
        userType: user?.adminProfile?.userType || 'NSA',
        role: user?.adminProfile?.role || 'admin',
        lastLogin: user?.adminProfile?.lastLogin || new Date().toISOString(),
        loginCount: user?.adminProfile?.loginCount || 1,
        status: user?.adminProfile?.status || 'Active',
        accountCreated: user?.adminProfile?.createdAt || new Date().toISOString()
    };

    const handleLogout = () => {
        if (window.confirm('Terminate secure admin session?')) {
            logout();
        }
    };

    const InfoCard = ({ icon: Icon, label, value, colorClass = 'text-gray-900' }: any) => (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group">
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className={`text-sm font-bold truncate max-w-[200px] ${colorClass}`}>{value}</p>
            </div>
        </div>
    );

    if (!isAdmin) return <AccessDenied section="Account" />;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Profile Header */}
            <div className="bg-gray-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-gray-400/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="h-28 w-28 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-black shadow-xl ring-4 ring-white/10">
                        {adminProfile.name[0]?.toUpperCase()}
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight">{adminProfile.name}</h1>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30">
                                {adminProfile.status}
                            </span>
                        </div>
                        <p className="text-lg text-blue-200/80 font-medium flex items-center justify-center md:justify-start gap-2">
                            <ShieldCheck className="h-5 w-5" />
                            Primary System {adminProfile.role}
                        </p>
                    </div>

                    <div className="md:ml-auto flex gap-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all border border-red-500/20 active:scale-95 shadow-xl shadow-red-500/10"
                        >
                            <LogOut className="h-5 w-5" />
                            End Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Contact Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <h2 className="text-xl font-extrabold text-gray-900">Personal Identity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard icon={User} label="Full Name" value={adminProfile.name} />
                        <InfoCard icon={Mail} label="Email Access" value={adminProfile.email} />
                        <InfoCard icon={Phone} label="Mobile Channel" value={adminProfile.mobile} />
                        <InfoCard icon={CalendarDays} label="Onboarded Since" value={new Date(adminProfile.accountCreated).toLocaleDateString()} />
                    </div>

                    <div className="pt-4 flex items-center gap-3 px-2">
                        <ShieldAlert className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-xl font-extrabold text-gray-900">System Permissions</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard icon={BadgeCheck} label="Membership Type" value={adminProfile.userType} />
                        <InfoCard icon={ShieldCheck} label="Assigned Role" value={adminProfile.role.toUpperCase()} colorClass="text-indigo-600" />
                    </div>
                </div>

                {/* System Activity Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Activity className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-xl font-extrabold text-gray-900">Session Metrics</h2>
                    </div>
                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total System Entries</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tight">{adminProfile.loginCount}</p>
                                </div>
                                <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Activity className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[65%] rounded-full shadow-lg shadow-emerald-500/20"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Last Active Signal
                            </p>
                            <div className="p-4 bg-gray-900 rounded-2xl">
                                <p className="text-white font-mono font-bold text-sm">
                                    {new Date(adminProfile.lastLogin).toLocaleString('en-IN', {
                                        timeZone: 'Asia/Kolkata',
                                        dateStyle: 'medium',
                                        timeStyle: 'medium'
                                    })}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">IST (Indian Standard Time)</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-gray-500 font-medium text-xs">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                This connection is end-to-end encrypted
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
