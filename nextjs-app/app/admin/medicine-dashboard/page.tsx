'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    ShoppingBag, IndianRupee, TrendingUp, AlertTriangle,
    Package, RefreshCw, BarChart2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';
import MetricCard from '@/components/admin/analytics/MetricCard';
import { adminAxios } from '@/lib/api/adminAxios';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending_payment:     { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
    payment_failed:      { label: 'Payment Failed',  color: 'bg-red-100 text-red-700' },
    confirmed:           { label: 'Confirmed',        color: 'bg-blue-100 text-blue-700' },
    prescription_required: { label: 'Rx Required',   color: 'bg-orange-100 text-orange-700' },
    prescription_verified: { label: 'Rx Verified',   color: 'bg-teal-100 text-teal-700' },
    packed:              { label: 'Packed',           color: 'bg-indigo-100 text-indigo-700' },
    shipped:             { label: 'Shipped',          color: 'bg-purple-100 text-purple-700' },
    out_for_delivery:    { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-700' },
    delivered:           { label: 'Delivered',        color: 'bg-green-100 text-green-700' },
    cancelled:           { label: 'Cancelled',        color: 'bg-red-100 text-red-700' },
    refunded:            { label: 'Refunded',         color: 'bg-gray-100 text-gray-700' },
};

export default function MedicineDashboard() {
    const { isAdmin, hasPermission } = useAdminAuth();
    if (!isAdmin && !hasPermission(PERMISSIONS.MEDICINES_VIEW)) return <AccessDenied section="Medicine Sales Dashboard" />;

    const [stats, setStats]     = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminAxios.get('/admin/medicine-dashboard');
            if (res.data.success) setStats(res.data.stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const byStatus     = stats?.byStatus    || {};
    const topMedicines = stats?.topMedicines || [];
    const lowStock     = stats?.lowStock     || [];
    const trend        = stats?.trend        || [];

    const trendData = trend.map((t: any) => ({
        date:    new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        Revenue: t.revenue,
        Orders:  t.orders,
    }));

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Medicine Sales Dashboard</h1>
                        <p className="text-sm text-gray-500">Medicine order performance and inventory</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Total Orders"    value={loading ? '…' : (stats?.totalOrders  ?? 0)} icon={ShoppingBag}  loading={loading} />
                <MetricCard title="Orders Today"    value={loading ? '…' : (stats?.ordersToday  ?? 0)} icon={ShoppingBag}  loading={loading} />
                <MetricCard title="Revenue (Month)" value={loading ? '…' : `₹${(stats?.monthRevenue ?? 0).toLocaleString('en-IN')}`} icon={IndianRupee} loading={loading} />
                <MetricCard title="Avg Order Value" value={loading ? '…' : `₹${(stats?.avgOrderValue ?? 0).toLocaleString('en-IN')}`} icon={TrendingUp}  loading={loading} />
            </div>

            {/* Revenue trend chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-emerald-600" /> Revenue — Last 7 Days
                </h2>
                {loading ? (
                    <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by status */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders by Status</h2>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(byStatus).filter(([, v]) => (v as number) > 0).sort(([, a], [, b]) => (b as number) - (a as number)).map(([status, count]) => {
                                const cfg = STATUS_LABELS[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
                                return (
                                    <div key={status} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                        <span className="text-sm font-bold text-gray-900">{count as number}</span>
                                    </div>
                                );
                            })}
                            {Object.keys(byStatus).length === 0 && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
                        </div>
                    )}
                </div>

                {/* Top selling medicines */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" /> Top Selling Medicines
                    </h2>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    ) : topMedicines.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No sales data yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs font-semibold text-gray-400 border-b border-gray-100">
                                        <th className="pb-2">#</th>
                                        <th className="pb-2">Medicine</th>
                                        <th className="pb-2 text-right">Units</th>
                                        <th className="pb-2 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {topMedicines.map((m: any, i: number) => (
                                        <tr key={m._id}>
                                            <td className="py-2.5 text-gray-400 font-semibold pr-2">{i + 1}</td>
                                            <td className="py-2.5 font-medium text-gray-900 max-w-[140px] truncate">{m.name}</td>
                                            <td className="py-2.5 text-right text-gray-700">{m.unitsSold}</td>
                                            <td className="py-2.5 text-right font-semibold text-gray-900">₹{(m.revenue || 0).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Low stock alerts */}
            {(loading || lowStock.length > 0) && (
                <div className="bg-white rounded-xl border border-orange-200 p-5">
                    <h2 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
                    </h2>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {lowStock.map((m: any) => (
                                <Link
                                    key={m._id}
                                    href={`/admin/medicines/${m._id || m.slug}/edit`}
                                    className="block border border-orange-200 rounded-lg p-3 hover:bg-orange-50 transition-colors"
                                >
                                    <p className="text-xs font-semibold text-gray-900 truncate">{m.name}</p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Stock: <span className="font-bold">{m.stockQuantity}</span>
                                        <span className="text-gray-400"> / {m.lowStockThreshold} min</span>
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
