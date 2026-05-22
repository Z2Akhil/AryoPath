'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import adminDashboardApi from '@/lib/api/adminDashboardApi';
import StaffDashboard from '@/components/admin/StaffDashboard';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { StaffProfile } from '@/types/staff';

function AdminDashboardContent() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminDashboardApi.getDashboardData();
            if (response.success) {
                setDashboardData(response.dashboard);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (err: any) {
            console.error('Error fetching dashboard:', err);
            setError(err.response?.data?.error || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="h-10 bg-gray-100 rounded"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 text-red-700">
                    <AlertCircle className="h-6 w-6" />
                    <div>
                        <h3 className="font-semibold">Failed to load dashboard</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="mt-4 sm:mt-0 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard
                    title={dashboardData.orders.title}
                    description={dashboardData.orders.description}
                    data={dashboardData.orders.data}
                    viewMoreUrl={dashboardData.orders.viewMoreUrl}
                    icon="orders"
                    stats={{
                        total: dashboardData.orders.total,
                        pending: dashboardData.orders.pending,
                        today: dashboardData.orders.todays
                    }}
                />
                <DashboardCard
                    title={dashboardData.analytics.title}
                    description={dashboardData.analytics.description}
                    viewMoreUrl={dashboardData.analytics.viewMoreUrl}
                    icon="analytics"
                    stats={{
                        revenue: `₹${(dashboardData.analytics.data.totalRevenue || 0).toLocaleString()}`,
                        orders: dashboardData.analytics.data.totalOrders,
                        users: dashboardData.analytics.data.totalUsers,
                        conversion: dashboardData.analytics.data.conversionRate
                    }}
                />
                <DashboardCard
                    title={dashboardData.notifications.title}
                    description={dashboardData.notifications.description}
                    data={dashboardData.notifications.data}
                    viewMoreUrl={dashboardData.notifications.viewMoreUrl}
                    icon="notifications"
                    stats={{
                        total: dashboardData.notifications.total,
                        recent: dashboardData.notifications.data?.length || 0
                    }}
                />
                <DashboardCard
                    title={dashboardData.users.title}
                    description={dashboardData.users.description}
                    data={dashboardData.users.data}
                    viewMoreUrl={dashboardData.users.viewMoreUrl}
                    icon="users"
                    stats={{
                        total: dashboardData.users.total,
                        'new (30d)': dashboardData.users.newLast30Days
                    }}
                />
                <DashboardCard
                    title={dashboardData.products.title}
                    description={dashboardData.products.description}
                    viewMoreUrl={dashboardData.products.viewMoreUrl}
                    icon="products"
                >
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-gray-800">Tests</div>
                                    <div className="text-sm text-gray-500">{dashboardData.products.totalTests} total</div>
                                </div>
                                <div className="text-lg font-bold text-indigo-600">
                                    {dashboardData.products.tests?.length || 0} active
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold text-gray-800">Offers</div>
                                    <div className="text-sm text-gray-500">{dashboardData.products.totalOffers} total</div>
                                </div>
                                <div className="text-lg font-bold text-indigo-600">
                                    {dashboardData.products.offers?.length || 0} active
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardCard>
                <DashboardCard
                    title={dashboardData.system.title}
                    description={dashboardData.system.description}
                    viewMoreUrl={dashboardData.system.viewMoreUrl}
                    icon="system"
                    stats={{
                        uptime: `${Math.floor(dashboardData.system.data.uptime / 3600)}h`,
                        'today orders': dashboardData.system.data.todaysOrders,
                        'pending': dashboardData.system.data.pendingOrders
                    }}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">₹{(dashboardData.analytics.data.totalRevenue || 0).toLocaleString()}</div>
                        <div className="text-sm text-blue-800">Total Revenue</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{dashboardData.orders.total}</div>
                        <div className="text-sm text-green-800">Total Orders</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">{dashboardData.users.total}</div>
                        <div className="text-sm text-purple-800">Total Users</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-600">{dashboardData.notifications.total}</div>
                        <div className="text-sm text-yellow-800">Total Notifications</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminHome() {
    const { isStaff, isAdmin, isLoading, isAuthenticated, permissions, user } = useAdminAuth();

    // Wait for auth to resolve — route guard in AdminAuthProvider handles redirect if not authenticated
    if (isLoading || !isAuthenticated) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm h-48" />
                    ))}
                </div>
            </div>
        );
    }

    if (isStaff) {
        return <StaffDashboard permissions={permissions} user={user as StaffProfile} />;
    }

    if (isAdmin) {
        return <AdminDashboardContent />;
    }

    return null;
}
