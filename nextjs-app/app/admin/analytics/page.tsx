'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import adminDashboardApi from '@/lib/api/adminDashboardApi';
import MetricCard from '@/components/admin/analytics/MetricCard';
import AnalyticsChart from '@/components/admin/analytics/AnalyticsChart';
import DateRangePicker from '@/components/admin/analytics/DateRangePicker';
import {
    ShoppingCart,
    Users,
    TrendingUp,
    Package,
    CheckCircle,
    Clock,
    IndianRupee,
    LayoutDashboard
} from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

const AnalyticsPage = () => {
    const { isAdmin } = useAdminAuth();
    const [loading, setLoading] = useState(true);
    const [trendsLoading, setTrendsLoading] = useState(true); // true = show skeleton while initial fetch runs
    const [error, setError] = useState('');

    // Analytics data states
    const [overviewData, setOverviewData] = useState<any>(null);
    const [trendsData, setTrendsData] = useState<any>(null);

    // Date range states
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Generate mock data for development/fallback
    const generateMockData = useCallback(() => {
        const mockOverview = {
            metrics: {
                totalOrders: 156,
                totalRevenue: 1250000,
                avgOrderValue: 8012,
                totalUsers: 89,
                newUsers: 12,
                conversionRate: 17.5,
                activeUsers: 45
            },
            orderStatus: {
                PENDING: 23,
                CREATED: 45,
                COMPLETED: 67,
                FAILED: 8,
                CANCELLED: 13
            },
            thyrocareStatus: {
                YET_TO_ASSIGN: 15,
                ASSIGNED: 28,
                ACCEPTED: 42,
                SERVICED: 19,
                DONE: 67,
                FAILED: 8
            }
        };

        const mockOrderTrends = [];
        const mockUserTrends = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            mockOrderTrends.push({
                date: dateStr,
                orderCount: Math.floor(Math.random() * 20) + 5,
                revenue: Math.floor(Math.random() * 200000) + 50000
            });

            mockUserTrends.push({
                date: dateStr,
                userCount: Math.floor(Math.random() * 8) + 2
            });
        }

        return {
            overview: mockOverview,
            trends: {
                orderTrends: mockOrderTrends,
                userTrends: mockUserTrends
            }
        };
    }, []);

    // Fetch analytics overview
    const fetchAnalyticsOverview = useCallback(async (start: string, end: string) => {
        try {
            setLoading(true);
            setError('');

            const params = {
                startDate: start || undefined,
                endDate: end || undefined
            };

            const data = await adminDashboardApi.getAnalyticsOverview(params);

            if (data.success) {
                setOverviewData(data.overview);
            } else {
                throw new Error(data.message || 'Failed to fetch analytics overview');
            }

        } catch (err: any) {
            console.error('Error fetching analytics overview:', err);
            setError(`Notice: Using demo data. (${err.message || 'API connection failed'})`);

            // Use mock data as fallback
            const mockData = generateMockData();
            setOverviewData(mockData.overview);
        } finally {
            setLoading(false);
        }
    }, [generateMockData]);

    // Fetch analytics trends
    const fetchAnalyticsTrends = useCallback(async (start: string, end: string) => {
        try {
            setTrendsLoading(true);

            const params = {
                period: 'daily',
                startDate: start || undefined,
                endDate: end || undefined
            };

            const data = await adminDashboardApi.getAnalyticsTrends(params);

            if (data.success) {
                setTrendsData(data.trends);
            } else {
                throw new Error(data.message || 'Failed to fetch analytics trends');
            }

        } catch (err) {
            console.error('Error fetching analytics trends:', err);
            // On error, set empty data so charts show the empty state properly
            setTrendsData({ orderTrends: [], userTrends: [] });
        } finally {
            setTrendsLoading(false);
        }
    }, []);

    // Handle date range change
    const handleDateChange = (startDate: string, endDate: string) => {
        setDateRange({ startDate, endDate });
        fetchAnalyticsOverview(startDate, endDate);
        fetchAnalyticsTrends(startDate, endDate);
    };


    // Prepare order status data for pie chart
    const orderStatusData = overviewData?.orderStatus ?
        Object.entries(overviewData.orderStatus).map(([status, count]) => ({
            name: status,
            value: count
        })).filter((item: any) => item.value > 0) : [];

    // Prepare Thyrocare status data for bar chart
    const thyrocareStatusData = overviewData?.thyrocareStatus ?
        Object.entries(overviewData.thyrocareStatus).map(([status, count]) => ({
            name: status.replace(/_/g, ' '),
            count: count
        })).filter((item: any) => item.count > 0) : [];

    // Prepare trends data
    const orderTrendsData = trendsData?.orderTrends || [];
    const userTrendsData = trendsData?.userTrends || [];

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!isAdmin) {
        return <AccessDenied section="Analytics" />;
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                </div>
                <DateRangePicker
                    onDateChange={handleDateChange}
                    loading={loading || trendsLoading}
                />
            </div>

            {/* Error/Notice Message */}
            {error && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Orders"
                    value={overviewData?.metrics?.totalOrders || 0}
                    trend={5.2}
                    subtitle="vs previous period"
                    icon={ShoppingCart}
                    loading={loading}
                />

                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(overviewData?.metrics?.totalRevenue || 0)}
                    trend={12.5}
                    subtitle="vs previous period"
                    icon={IndianRupee}
                    loading={loading}
                />

                <MetricCard
                    title="Active Users"
                    value={overviewData?.metrics?.activeUsers || 0}
                    trend={3.8}
                    subtitle="placed orders"
                    icon={Users}
                    loading={loading}
                />

                <MetricCard
                    title="Conversion Rate"
                    value={`${overviewData?.metrics?.conversionRate || 0}%`}
                    trend={2.1}
                    subtitle="signup to order"
                    icon={TrendingUp}
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Order Status Distribution */}
                <AnalyticsChart
                    type="pie"
                    data={orderStatusData}
                    title="Order Status Distribution"
                    loading={loading}
                    height={350}
                />

                {/* Revenue Trend */}
                <AnalyticsChart
                    type="line"
                    data={orderTrendsData}
                    xKey="date"
                    yKeys={['revenue']}
                    title="Revenue Trend"
                    loading={trendsLoading}
                    height={350}
                />
            </div>

            {/* Second Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* User Signup Trend */}
                <AnalyticsChart
                    type="area"
                    data={userTrendsData}
                    xKey="date"
                    yKeys={['userCount']}
                    title="User Signup Trend"
                    loading={trendsLoading}
                    height={350}
                />

                {/* Thyrocare Status Flow */}
                <AnalyticsChart
                    type="bar"
                    data={thyrocareStatusData}
                    xKey="name"
                    yKeys={['count']}
                    title="Thyrocare Status Flow"
                    loading={loading}
                    height={350}
                />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Avg Order Value"
                    value={formatCurrency(overviewData?.metrics?.avgOrderValue || 0)}
                    icon={Package}
                    loading={loading}
                />

                <MetricCard
                    title="New Users"
                    value={overviewData?.metrics?.newUsers || 0}
                    icon={Users}
                    loading={loading}
                />

                <MetricCard
                    title="Completed Orders"
                    value={overviewData?.orderStatus?.COMPLETED || 0}
                    icon={CheckCircle}
                    loading={loading}
                />

                <MetricCard
                    title="Pending Orders"
                    value={overviewData?.orderStatus?.PENDING || 0}
                    icon={Clock}
                    loading={loading}
                />
            </div>

            {/* Stats Summary */}
            {overviewData && (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Failed Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.FAILED || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Created Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.CREATED || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-gray-600">Cancelled Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{overviewData.orderStatus?.CANCELLED || 0}</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{overviewData.metrics?.totalUsers || 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
