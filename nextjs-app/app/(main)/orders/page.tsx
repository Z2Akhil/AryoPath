'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';
import {
    Loader, AlertCircle, PackageIcon as PackageIcon2,
    ChevronLeft, ChevronRight, ShoppingCart,
    Package, TrendingUp, Activity, CheckCircle,
    ArrowLeft, FlaskConical, Pill, Truck, MapPin,
    Clock, XCircle, RefreshCw,
} from 'lucide-react';
import { fetchUserOrders, type Order } from '@/lib/api/ordersApi';
import { OrderListItem } from '@/components/orders/OrderListItem';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import type { MedicineOrder, MedicineOrderStatus } from '@/types/medicineOrder';

// ─── Medicine order helpers ────────────────────────────────────────────────────

const MED_STATUS_CFG: Record<MedicineOrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending_payment:       { label: 'Pending Payment',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200',  icon: <Clock className="h-3 w-3" /> },
    payment_failed:        { label: 'Payment Failed',     color: 'text-red-700',    bg: 'bg-red-50 border-red-200',        icon: <XCircle className="h-3 w-3" /> },
    confirmed:             { label: 'Confirmed',           color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',      icon: <CheckCircle className="h-3 w-3" /> },
    prescription_required: { label: 'Rx Required',        color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',  icon: <AlertCircle className="h-3 w-3" /> },
    prescription_verified: { label: 'Rx Verified',        color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',    icon: <CheckCircle className="h-3 w-3" /> },
    shipped:               { label: 'Shipped',             color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200',  icon: <Truck className="h-3 w-3" /> },
    out_for_delivery:      { label: 'Out for Delivery',   color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200',      icon: <MapPin className="h-3 w-3" /> },
    delivered:             { label: 'Delivered',           color: 'text-green-700',  bg: 'bg-green-50 border-green-200',    icon: <CheckCircle className="h-3 w-3" /> },
    cancelled:             { label: 'Cancelled',           color: 'text-red-600',    bg: 'bg-red-50 border-red-200',        icon: <XCircle className="h-3 w-3" /> },
    refunded:              { label: 'Refunded',            color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',      icon: <RefreshCw className="h-3 w-3" /> },
    return_requested:      { label: 'Return Requested',    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',  icon: <RefreshCw className="h-3 w-3" /> },
    return_received:       { label: 'Return Received',     color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200',  icon: <CheckCircle className="h-3 w-3" /> },
};

function MedicineOrderCard({ order }: { order: MedicineOrder }) {
    const cfg = MED_STATUS_CFG[order.status] ?? { label: order.status, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: null };
    const firstItem = order.items[0];
    const itemLabel = order.items.length === 1
        ? firstItem?.name
        : `${firstItem?.name} +${order.items.length - 1} more`;
    const awb = (order as any).awb;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon */}
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5 text-teal-600" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-xs font-mono font-bold text-gray-500">{order.orderId}</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                    </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{itemLabel}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs font-bold text-gray-700">₹{order.grandTotal.toFixed(0)}</p>
                    {awb && (
                        <p className="text-xs text-teal-600 font-mono font-semibold">AWB: {awb}</p>
                    )}
                </div>
            </div>

            {/* Track button */}
            <Link
                href={`/medicines/orders/${order.orderId}`}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition-colors"
            >
                <Truck className="h-3.5 w-3.5" />
                {['shipped', 'out_for_delivery'].includes(order.status) ? 'Track' : 'View'}
            </Link>
        </div>
    );
}

// ─── Top-level type tabs ───────────────────────────────────────────────────────

type OrderType = 'tests' | 'medicines';
type LabTab = 'all' | 'active' | 'completed' | 'cancelled';
const VALID_LAB_TABS: LabTab[] = ['all', 'active', 'completed', 'cancelled'];
const ORDERS_PER_PAGE = 8;

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-teal-500" />
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}

function OrdersContent() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const orderType: OrderType = searchParams.get('type') === 'medicines' ? 'medicines' : 'tests';

    // Lab test orders
    const [labOrders, setLabOrders]       = useState<Order[]>([]);
    const [labLoading, setLabLoading]     = useState(true);
    const [labError, setLabError]         = useState('');
    const initialTab = (searchParams.get('tab') ?? 'all') as LabTab;
    const [labTab, setLabTab]             = useState<LabTab>(VALID_LAB_TABS.includes(initialTab) ? initialTab : 'all');
    const [currentPage, setCurrentPage]   = useState(1);

    // Medicine orders
    const [medOrders, setMedOrders]       = useState<MedicineOrder[]>([]);
    const [medLoading, setMedLoading]     = useState(true);
    const [medError, setMedError]         = useState('');
    const [medPage, setMedPage]           = useState(1);
    const [medTotalPages, setMedTotalPages] = useState(1);

    useEffect(() => {
        if (!userLoading && !user) router.replace('/');
    }, [user, userLoading, router]);

    useEffect(() => {
        if (!user) return;
        fetchUserOrders()
            .then(data => setLabOrders(data || []))
            .catch(() => setLabError('Unable to load lab test orders.'))
            .finally(() => setLabLoading(false));
    }, [user]);

    const loadMedOrders = useCallback(async () => {
        if (!user) return;
        setMedLoading(true);
        try {
            const res = await medicineOrderApi.getUserOrders(medPage, 10);
            if (res.success) {
                setMedOrders(res.data);
                setMedTotalPages(res.pagination.totalPages);
            }
        } catch { setMedError('Unable to load medicine orders.'); }
        finally { setMedLoading(false); }
    }, [user, medPage]);

    useEffect(() => { loadMedOrders(); }, [loadMedOrders]);

    // Lab stats
    const activeCount    = labOrders.filter(o => !['DONE','REPORTED','CANCELLED','FAILED','COMPLETED'].includes((o.status||'').toUpperCase())).length;
    const completedCount = labOrders.filter(o => ['DONE','REPORTED','COMPLETED'].includes((o.status||'').toUpperCase())).length;
    const cancelledCount = labOrders.filter(o => ['CANCELLED','FAILED'].includes((o.status||'').toUpperCase())).length;
    const totalSpent     = labOrders.reduce((s,o) => s + (o.payment?.amount || o.package?.price || 0), 0);

    const labTabs: { key: LabTab; label: string; count: number }[] = [
        { key: 'all',       label: 'All',       count: labOrders.length },
        { key: 'active',    label: 'Active',    count: activeCount },
        { key: 'completed', label: 'Completed', count: completedCount },
        { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
    ];

    const filteredLab = (() => {
        switch (labTab) {
            case 'active':    return labOrders.filter(o => !['DONE','REPORTED','CANCELLED','FAILED','COMPLETED'].includes((o.status||'').toUpperCase()));
            case 'completed': return labOrders.filter(o => ['DONE','REPORTED','COMPLETED'].includes((o.status||'').toUpperCase()));
            case 'cancelled': return labOrders.filter(o => ['CANCELLED','FAILED'].includes((o.status||'').toUpperCase()));
            default:          return labOrders;
        }
    })();
    const totalLabPages    = Math.ceil(filteredLab.length / ORDERS_PER_PAGE);
    const paginatedLabOrders = filteredLab.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

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
            {/* Sticky header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 py-4">
                        <button onClick={() => router.back()} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            {orderType === 'tests'
                                ? <FlaskConical className="h-4 w-4 text-blue-600" />
                                : <Pill className="h-4 w-4 text-teal-600" />
                            }
                            <h1 className="text-base font-extrabold text-gray-900">
                                {orderType === 'tests' ? 'Lab Test Orders' : 'Medicine Orders'}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5">

                {/* ─── LAB TESTS TAB ─── */}
                {orderType === 'tests' && (
                    <>
                        {/* Stats */}
                        {!labLoading && labOrders.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total',     value: labOrders.length, icon: Package,     bg: 'bg-blue-50',    color: 'text-blue-600' },
                                    { label: 'Spent',     value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                                    { label: 'Active',    value: activeCount,      icon: Activity,    bg: 'bg-amber-50',   color: 'text-amber-600' },
                                    { label: 'Completed', value: completedCount,   icon: CheckCircle, bg: 'bg-purple-50',  color: 'text-purple-600' },
                                ].map(({ label, value, icon: Icon, bg, color }) => (
                                    <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
                                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-gray-500 font-medium">{label}</p>
                                            <p className="text-base font-black text-gray-900">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Sub-tabs */}
                            <div className="flex gap-1.5 px-4 sm:px-5 pt-4 pb-1 overflow-x-auto border-b border-gray-50">
                                {labTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => { setLabTab(tab.key); setCurrentPage(1); }}
                                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all mb-3 ${
                                            labTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${labTab === tab.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 sm:p-5">
                                {labLoading ? (
                                    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-2xl" />)}</div>
                                ) : labError ? (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-medium">{labError}</p>
                                    </div>
                                ) : filteredLab.length === 0 ? (
                                    <div className="py-14 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FlaskConical className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-500 mb-1">No {labTab === 'all' ? '' : labTab} lab test orders</p>
                                        {labTab === 'all' && (
                                            <Link href="/profiles" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                                                <ShoppingCart className="w-4 h-4" /> Browse Packages
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-400 mb-3">
                                            Showing {(currentPage-1)*ORDERS_PER_PAGE+1}–{Math.min(currentPage*ORDERS_PER_PAGE, filteredLab.length)} of {filteredLab.length}
                                        </p>
                                        <div className="space-y-3 mb-5">
                                            {paginatedLabOrders.map(order => <OrderListItem key={order.orderId} order={order} />)}
                                        </div>
                                        {totalLabPages > 1 && (
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                    <ChevronLeft className="w-4 h-4" /> Prev
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({length: totalLabPages}, (_,i) => i+1).map(p => (
                                                        <button key={p} onClick={() => setCurrentPage(p)}
                                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p===currentPage ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={() => setCurrentPage(p => Math.min(totalLabPages,p+1))} disabled={currentPage===totalLabPages}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                    Next <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ─── MEDICINES TAB ─── */}
                {orderType === 'medicines' && (
                    <>
                        {medLoading ? (
                            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-white rounded-2xl border border-gray-100" />)}</div>
                        ) : medError ? (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-medium">{medError}</p>
                            </div>
                        ) : medOrders.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Pill className="w-8 h-8 text-teal-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 mb-1">No medicine orders yet</p>
                                <Link href="/medicines" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors">
                                    <ShoppingCart className="w-4 h-4" /> Shop Medicines
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {medOrders.map(order => <MedicineOrderCard key={order.orderId} order={order} />)}
                                </div>
                                {medTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <button onClick={() => setMedPage(p => Math.max(1,p-1))} disabled={medPage===1}
                                            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <span className="text-sm font-semibold text-gray-600">Page {medPage} of {medTotalPages}</span>
                                        <button onClick={() => setMedPage(p => Math.min(medTotalPages,p+1))} disabled={medPage===medTotalPages}
                                            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}
