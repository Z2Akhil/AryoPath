'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    CalendarDays, Video, Phone, Clock, CheckCircle,
    XCircle, IndianRupee, Users, TrendingUp,
} from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';
import MetricCard from '@/components/admin/analytics/MetricCard';
import adminAppointmentApi from '@/lib/api/adminAppointmentApi';

function formatDateTime(dt: string) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function ConsultationDashboard() {
    const { isAdmin, hasPermission } = useAdminAuth();
    if (!isAdmin && !hasPermission(PERMISSIONS.APPOINTMENTS_VIEW)) return <AccessDenied section="Consultation Dashboard" />;

    const [stats, setStats]   = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminAppointmentApi.getStats();
            if (res.success) setStats(res.stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const byStatus   = stats?.byStatus   || {};
    const upcoming   = stats?.upcoming   || [];
    const topDoctors = stats?.topDoctors || [];
    const byMode     = stats?.byMode     || {};
    const totalMode  = (byMode.video || 0) + (byMode.audio || 0) || 1;
    const videoPct   = Math.round(((byMode.video || 0) / totalMode) * 100);

    const statusRows = [
        { key: 'pending',   label: 'Pending',   color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
        { key: 'confirmed', label: 'Confirmed',  color: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50' },
        { key: 'completed', label: 'Completed',  color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50' },
        { key: 'cancelled', label: 'Cancelled',  color: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50' },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Consultation Dashboard</h1>
                <p className="text-sm text-gray-500">Doctor consultation performance overview</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Consultations" value={loading ? '…' : (stats?.total ?? 0)} icon={CalendarDays} loading={loading} />
                <MetricCard title="This Month"          value={loading ? '…' : (stats?.thisMonth ?? 0)} icon={TrendingUp} loading={loading} />
                <MetricCard title="Pending"             value={loading ? '…' : (byStatus.pending ?? 0)} icon={Clock} loading={loading} />
                <MetricCard
                    title="Revenue (Month)"
                    value={loading ? '…' : `₹${(stats?.revenueMonth ?? 0).toLocaleString('en-IN')}`}
                    icon={IndianRupee}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Status Breakdown</h2>
                    <div className="space-y-3">
                        {statusRows.map(({ key, label, color, text, bg }) => {
                            const count = byStatus[key] || 0;
                            const total = stats?.total || 1;
                            const pct   = Math.round((count / total) * 100);
                            return (
                                <div key={key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={`font-semibold ${text}`}>{label}</span>
                                        <span className="text-gray-500">{loading ? '…' : count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: loading ? '0%' : `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mode split */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Consultation Mode</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-xs text-gray-600">Video</span>
                                <span className="text-xs font-bold text-gray-900">{loading ? '…' : (byMode.video || 0)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-400" />
                                <span className="text-xs text-gray-600">Audio</span>
                                <span className="text-xs font-bold text-gray-900">{loading ? '…' : (byMode.audio || 0)}</span>
                            </div>
                        </div>
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: loading ? '0%' : `${videoPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* Upcoming appointments */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-700">Upcoming Appointments</h2>
                        <Link href="/admin/appointments?status=confirmed" className="text-xs text-blue-600 hover:underline">View all →</Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : upcoming.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <CalendarDays className="h-8 w-8 mb-2" />
                            <p className="text-sm">No upcoming appointments</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {upcoming.map((appt: any) => (
                                <div key={appt._id} className="flex items-center justify-between py-2.5 gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{appt.patientName}</p>
                                        <p className="text-xs text-gray-400 truncate">{appt.doctorName}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(appt.appointmentDateTime)}</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${appt.consultationMode === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {appt.consultationMode === 'video' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                                        {appt.consultationMode}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                                        ₹{(appt.finalAmount || appt.consultationFee || 0).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top doctors */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Doctors by Consultations (This Month)</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                    </div>
                ) : topDoctors.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No data for this month</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                    <th className="pb-2 pr-4">#</th>
                                    <th className="pb-2 pr-4">Doctor</th>
                                    <th className="pb-2 pr-4 text-right">Consultations</th>
                                    <th className="pb-2 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topDoctors.map((d: any, i: number) => (
                                    <tr key={d._id} className="py-2">
                                        <td className="py-2.5 pr-4 text-gray-400 font-semibold">{i + 1}</td>
                                        <td className="py-2.5 pr-4 font-medium text-gray-900">{d.doctorName}</td>
                                        <td className="py-2.5 pr-4 text-right text-gray-700">{d.count}</td>
                                        <td className="py-2.5 text-right font-semibold text-gray-900">₹{(d.revenue || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
