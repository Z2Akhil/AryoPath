'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { AdminOrder, OrderStats as IOrderStats } from '@/types/admin';
import Pagination from '@/components/common/Pagination';
import OrderStats from '@/components/admin/orders/OrderStats';
import OrderFilters from '@/components/admin/orders/OrderFilters';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

export default function OrderPage() {
    const { isAdmin, hasPermission } = useAdminAuth();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<IOrderStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Sync status states
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [syncError, setSyncError] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [thyrocareStatusFilter, setThyrocareStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm.trim() || undefined,
                status: statusFilter || undefined,
                thyrocareStatus: thyrocareStatusFilter || undefined,
                startDate: dateRange.startDate || undefined,
                endDate: dateRange.endDate || undefined
            };

            const response = await adminOrderApi.getOrders(params);

            setOrders(response.orders || []);
            setTotalOrders(response.pagination?.totalOrders || 0);
            setTotalPages(response.pagination?.totalPages || 1);

        } catch (err: any) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders. Please try again.');
            setOrders([]);
            setTotalOrders(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, statusFilter, thyrocareStatusFilter, dateRange, searchTerm]);

    const fetchOrderStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const response = await adminOrderApi.getOrderStats();
            setStats(response.stats);
        } catch (err) {
            console.error('Error fetching order stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchOrderStats();
    }, [fetchOrders, fetchOrderStats]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleThyrocareStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setThyrocareStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
        setDateRange(prev => ({ ...prev, [type]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setThyrocareStatusFilter('');
        setDateRange({ startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const handleSyncAll = async () => {
        try {
            setSyncLoading(true);
            setSyncError('');
            setSyncResult(null);

            const response = await adminOrderApi.syncAllOrdersStatus();
            setSyncResult(response);
            await fetchOrders();
            await fetchOrderStats();

            setTimeout(() => setSyncResult(null), 5000);
        } catch (err: any) {
            console.error('Error syncing all orders:', err);
            setSyncError(err.response?.data?.error || 'Failed to sync orders status');
            setTimeout(() => setSyncError(''), 5000);
        } finally {
            setSyncLoading(false);
        }
    };

    if (!isAdmin && !hasPermission(PERMISSIONS.LAB_ORDERS_VIEW)) {
        return <AccessDenied section="Orders" />;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders Management</h1>
                        <p className="text-gray-500 mt-1">Manage, track and sync customer diagnostic orders.</p>
                    </div>
                    <button
                        onClick={handleSyncAll}
                        disabled={syncLoading}
                        className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                        {syncLoading ? 'Performing Sync...' : 'Sync Active Orders'}
                    </button>
                </div>

                {/* Stats Cards */}
                <OrderStats stats={stats} loading={statsLoading} />

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {syncResult && (
                    <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-green-700 mb-4 font-black text-lg">
                            <CheckCircle className="h-6 w-6" />
                            Status Sync Completed Successfully
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white border border-green-100 p-3 rounded-xl shadow-xs">
                                <p className="text-xs text-green-600 uppercase font-bold mb-1">Total</p>
                                <p className="text-xl font-black text-gray-900">{syncResult.total}</p>
                            </div>
                            <div className="bg-white border border-green-100 p-3 rounded-xl shadow-xs">
                                <p className="text-xs text-green-600 uppercase font-bold mb-1">Success</p>
                                <p className="text-xl font-black text-gray-900">{syncResult.successful}</p>
                            </div>
                            <div className="bg-white border border-green-100 p-3 rounded-xl shadow-xs">
                                <p className="text-xs text-green-600 uppercase font-bold mb-1">Failed</p>
                                <p className="text-xl font-black text-red-600">{syncResult.failed}</p>
                            </div>
                            <div className="bg-white border border-green-100 p-3 rounded-xl shadow-xs">
                                <p className="text-xs text-green-600 uppercase font-bold mb-1">Changed</p>
                                <p className="text-xl font-black text-blue-600">{syncResult.statusChanged}</p>
                            </div>
                        </div>
                    </div>
                )}

                {syncError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-in shake duration-300">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">{syncError}</span>
                    </div>
                )}

                {/* Search and Filters */}
                <OrderFilters
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    statusFilter={statusFilter}
                    onStatusFilterChange={handleStatusFilterChange}
                    thyrocareStatusFilter={thyrocareStatusFilter}
                    onThyrocareStatusFilterChange={handleThyrocareStatusFilterChange}
                    dateRange={dateRange}
                    onDateChange={handleDateChange}
                    onClearFilters={clearFilters}
                    onRefresh={fetchOrders}
                    loading={loading}
                    syncLoading={syncLoading}
                />

                {/* Orders Table */}
                <div className="mb-8">
                    <OrdersTable
                        orders={orders}
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        thyrocareStatusFilter={thyrocareStatusFilter}
                        dateRange={dateRange}
                        onRefreshOrder={fetchOrders}
                    />
                </div>

                {/* Pagination */}
                {orders.length > 0 && (
                    <div className="flex justify-center md:justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            itemsPerPage={itemsPerPage}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            totalItems={totalOrders}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
