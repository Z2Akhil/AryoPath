'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/providers/UserProvider';
import {
    Loader, AlertCircle, PackageIcon as PackageIcon2,
    ChevronLeft, ChevronRight, ShoppingCart,
    Package, TrendingUp, Activity, CheckCircle,
    ArrowLeft,
} from 'lucide-react';
import { fetchUserOrders, type Order } from '@/lib/api/ordersApi';
import { OrderListItem } from '@/components/orders/OrderListItem';

type TabKey = 'all' | 'active' | 'completed' | 'cancelled';
const VALID_TABS: TabKey[] = ['all', 'active', 'completed', 'cancelled'];
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

    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState('');

    const initialTab = (searchParams.get('tab') ?? 'all') as TabKey;
    const [activeTab, setActiveTab] = useState<TabKey>(VALID_TABS.includes(initialTab) ? initialTab : 'all');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!userLoading && !user) router.replace('/');
    }, [user, userLoading, router]);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                setOrdersLoading(true);
                const data = await fetchUserOrders();
                setOrders(data || []);
            } catch { setOrdersError('Unable to load orders. Please try again.'); }
            finally { setOrdersLoading(false); }
        };
        load();
    }, [user]);

    const activeCount = orders.filter(o => !['DONE', 'REPORTED', 'CANCELLED', 'FAILED', 'COMPLETED'].includes((o.status || '').toUpperCase())).length;
    const completedCount = orders.filter(o => ['DONE', 'REPORTED', 'COMPLETED'].includes((o.status || '').toUpperCase())).length;
    const cancelledCount = orders.filter(o => ['CANCELLED', 'FAILED'].includes((o.status || '').toUpperCase())).length;
    const totalSpent = orders.reduce((s, o) => s + (o.payment?.amount || o.package?.price || 0), 0);

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: 'all', label: 'All Orders', count: orders.length },
        { key: 'active', label: 'Active', count: activeCount },
        { key: 'completed', label: 'Completed', count: completedCount },
        { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
    ];

    const filteredOrders = (() => {
        switch (activeTab) {
            case 'active': return orders.filter(o => !['DONE', 'REPORTED', 'CANCELLED', 'FAILED', 'COMPLETED'].includes((o.status || '').toUpperCase()));
            case 'completed': return orders.filter(o => ['DONE', 'REPORTED', 'COMPLETED'].includes((o.status || '').toUpperCase()));
            case 'cancelled': return orders.filter(o => ['CANCELLED', 'FAILED'].includes((o.status || '').toUpperCase()));
            default: return orders;
        }
    })();

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

    const handleTabChange = (tab: TabKey) => { setActiveTab(tab); setCurrentPage(1); };

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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                    <Link
                        href="/account"
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                        aria-label="Back to account"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-base font-extrabold text-gray-900">My Orders</h1>
                        {!ordersLoading && (
                            <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5">

                {/* Stats */}
                {!ordersLoading && orders.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Total', value: orders.length, icon: Package, bg: 'bg-blue-50', color: 'text-blue-600' },
                            { label: 'Spent', value: `₹${totalSpent.toLocaleString()}`, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                            { label: 'Active', value: activeCount, icon: Activity, bg: 'bg-amber-50', color: 'text-amber-600' },
                            { label: 'Completed', value: completedCount, icon: CheckCircle, bg: 'bg-purple-50', color: 'text-purple-600' },
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

                {/* Tabs + Order list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                    {/* Tab bar */}
                    <div className="flex gap-1.5 px-4 sm:px-5 pt-4 pb-1 overflow-x-auto scrollbar-hide border-b border-gray-50">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all mb-3 ${
                                    activeTab === tab.key
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 sm:p-5">
                        {ordersLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : ordersError ? (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-medium">{ordersError}</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="py-14 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <PackageIcon2 className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-500 mb-1">
                                    No {activeTab === 'all' ? '' : activeTab} orders yet
                                </p>
                                <p className="text-xs text-gray-400 mb-4">
                                    {activeTab === 'all'
                                        ? 'Your booked tests will appear here.'
                                        : `You have no ${activeTab} orders at the moment.`}
                                </p>
                                {activeTab === 'all' && (
                                    <Link
                                        href="/profiles"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        <ShoppingCart className="w-4 h-4" /> Browse Packages
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Count line */}
                                <p className="text-xs text-gray-400 mb-3">
                                    Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}–{Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                                </p>

                                <div className="space-y-3 mb-5">
                                    {paginatedOrders.map(order => (
                                        <OrderListItem key={order.orderId} order={order} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Prev
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                                        page === currentPage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
