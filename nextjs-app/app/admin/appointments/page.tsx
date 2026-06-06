'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    CalendarDays, Search, RefreshCw, Video, Phone,
    CheckCircle, Clock, XCircle, AlertCircle, IndianRupee, Users,
} from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';
import adminAppointmentApi from '@/lib/api/adminAppointmentApi';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700',  icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700',      icon: CheckCircle },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700',    icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',        icon: XCircle },
    no_show:   { label: 'Expired',   color: 'bg-gray-100 text-gray-500',      icon: XCircle },
    expired:   { label: 'Expired',   color: 'bg-gray-100 text-gray-500',      icon: XCircle },
};

function resolveStatus(appt: any): string {
    if (['pending', 'confirmed'].includes(appt.status)) {
        const slotEnded = new Date(appt.appointmentDateTime).getTime() + 30 * 60 * 1000 < Date.now();
        if (slotEnded) return 'expired';
    }
    return appt.status;
}

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const;

function formatDateTime(dt: string) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function AppointmentsPage() {
    const { isAdmin, hasPermission } = useAdminAuth();
    if (!isAdmin && !hasPermission(PERMISSIONS.APPOINTMENTS_VIEW)) return <AccessDenied section="Appointments" />;

    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats]               = useState<any>(null);
    const [loading, setLoading]           = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [search, setSearch]             = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage]                 = useState(1);
    const [pagination, setPagination]     = useState({ total: 0, pages: 1 });
    const [updatingId, setUpdatingId]     = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminAppointmentApi.list({
                page,
                status: statusFilter === 'all' ? '' : statusFilter,
                search,
            });
            if (res.success) {
                setAppointments(res.appointments);
                setPagination(res.pagination);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await adminAppointmentApi.getStats();
            if (res.success) setStats(res.stats);
        } catch (e) {
            console.error(e);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleStatusUpdate = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
        setUpdatingId(id);
        try {
            const res = await adminAppointmentApi.updateStatus(id, newStatus);
            if (res.success) {
                setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
                fetchStats();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <CalendarDays className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-sm text-gray-500">Manage doctor consultation bookings</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { fetchAppointments(); fetchStats(); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Today',      value: stats?.today        ?? '—', icon: CalendarDays, color: 'text-blue-600',  bg: 'bg-blue-50' },
                    { label: 'This Week',  value: stats?.thisWeek     ?? '—', icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'This Month', value: stats?.thisMonth    ?? '—', icon: Users,        color: 'text-green-600',  bg: 'bg-green-50' },
                    { label: 'Revenue (Month)', value: stats ? `₹${(stats.revenueMonth ?? 0).toLocaleString('en-IN')}` : '—', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                        <div className={`p-2 ${bg} rounded-lg`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-lg font-bold text-gray-900">{statsLoading ? '…' : value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                        type="search"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search patient name or mobile…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setStatusFilter(f); setPage(1); }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                                statusFilter === f
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                        >
                            {f === 'all' ? `All (${stats?.total ?? 0})` : `${f} (${stats?.byStatus?.[f] ?? 0})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <CalendarDays className="h-10 w-10 mb-3" />
                        <p className="text-sm font-medium">No appointments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Patient', 'Doctor', 'Date & Time', 'Mode', 'Status', 'Amount', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {appointments.map(appt => {
                                    const resolvedStatus = resolveStatus(appt);
                                    const isExpiredAppt  = resolvedStatus === 'expired';
                                    const sc     = STATUS_CONFIG[resolvedStatus] || STATUS_CONFIG.pending;
                                    const Icon   = sc.icon;
                                    const isVideo = appt.consultationMode === 'video';
                                    const busy   = updatingId === appt._id;

                                    return (
                                        <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900">{appt.patientName}</p>
                                                <p className="text-xs text-gray-400">{appt.patientMobile}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{appt.doctorName || '—'}</td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {formatDateTime(appt.appointmentDateTime)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isVideo ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {isVideo ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                                                    {isVideo ? 'Video' : 'Audio'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                ₹{(appt.finalAmount || appt.consultationFee || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 flex-wrap items-center">
                                                    <Link
                                                        href={`/admin/appointments/${appt._id}`}
                                                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                    >
                                                        View
                                                    </Link>
                                                    {!isExpiredAppt && appt.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                                                            disabled={busy}
                                                            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {!isExpiredAppt && appt.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(appt._id, 'completed')}
                                                            disabled={busy}
                                                            className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}
                                                    {!isExpiredAppt && ['pending', 'confirmed'].includes(appt.status) && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(appt._id, 'cancelled')}
                                                            disabled={busy}
                                                            className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {busy && <RefreshCw className="h-4 w-4 animate-spin text-gray-400 mt-1" />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
                    <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pagination.pages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
            )}
        </div>
    );
}
