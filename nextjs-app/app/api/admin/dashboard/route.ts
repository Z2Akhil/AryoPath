export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminOrStaffAuth(req, PERMISSIONS.LAB_ORDERS_VIEW);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Extract IP address and User-Agent for logging
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        console.log('Fetching dashboard data for admin:', auth.admin.name);

        // Fetch data in parallel for better performance
        const [
            recentOrders,
            userStats,
            recentNotifications,
            popularTests,
            popularOffers,
            systemStatus
        ] = await Promise.all([
            // Recent Orders (top 5)
            Order.find()
                .populate('userId', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('orderId contactInfo package status createdAt thyrocare.status')
                .lean(),

            // User Statistics
            Promise.all([
                User.countDocuments(),
                User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } }),
                User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email mobileNumber createdAt').lean()
            ]),

            // Recent Notifications (top 5)
            Notification.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('subject emailType status createdAt')
                .lean(),

            // Popular Tests (top 5 by custom pricing updates)
            Test.find({ customDiscount: { $gt: 0 } })
                .sort({ updatedAt: -1 })
                .limit(5)
                .select('code name mrp customDiscount sellingPrice')
                .lean(),

            // Popular Offers (top 5)
            Offer.find()
                .sort({ updatedAt: -1 })
                .limit(5)
                .select('code name mrp customDiscount sellingPrice')
                .lean(),

            // System Status
            Promise.all([
                Order.countDocuments(),
                Order.countDocuments({ status: 'PENDING' }),
                Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
            ])
        ]);

        // Process orders data
        const processedOrders = recentOrders.map((order: any) => ({
            id: order.orderId,
            customer: order.contactInfo?.email || 'N/A',
            status: order.status,
            thyrocareStatus: order.thyrocare?.status || 'N/A',
            amount: order.package?.price || 0,
            date: order.createdAt
        }));

        // Process user data
        const [totalUsers, newUsersLast30Days, recentUsers] = userStats;
        const processedUsers = recentUsers.map((user: any) => ({
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
            email: user.email,
            phone: user.mobileNumber,
            joined: user.createdAt
        }));

        // Process notifications
        const processedNotifications = recentNotifications.map((notification: any) => ({
            title: notification.subject,
            type: notification.emailType,
            status: notification.status,
            date: notification.createdAt
        }));

        // Process products
        const processedTests = popularTests.map((test: any) => ({
            code: test.code,
            name: test.name,
            mrp: test.mrp,
            discount: test.customDiscount,
            sellingPrice: test.sellingPrice
        }));

        const processedOffers = popularOffers.map((offer: any) => ({
            code: offer.code,
            name: offer.name,
            mrp: offer.mrp,
            discount: offer.customDiscount,
            sellingPrice: offer.sellingPrice
        }));

        // System stats
        const [totalOrders, pendingOrders, todaysOrders] = systemStatus;

        // Calculate analytics metrics
        const revenueData = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$package.price' },
                    avgOrderValue: { $avg: '$package.price' }
                }
            }
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const avgOrderValue = revenueData[0]?.avgOrderValue || 0;
        const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : '0';

        // Log admin activity (skip for staff — no adminId)
        const { adminId, sessionId } = getAdminContext(auth);
        if (adminId) await AdminActivity.logActivity({
            adminId,
            sessionId,
            action: 'DASHBOARD_FETCH',
            description: `Admin fetched dashboard data`,
            resource: 'dashboard',
            endpoint: '/api/admin/dashboard',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                ordersCount: processedOrders.length,
                usersCount: processedUsers.length,
                notificationsCount: processedNotifications.length
            }
        });

        return NextResponse.json({
            success: true,
            dashboard: {
                orders: {
                    title: 'Recent Orders',
                    description: 'Latest customer orders and their status',
                    data: processedOrders,
                    total: totalOrders,
                    pending: pendingOrders,
                    todays: todaysOrders,
                    viewMoreUrl: '/orders'
                },
                analytics: {
                    title: 'Business Insights',
                    description: 'Key performance metrics and trends',
                    data: {
                        totalRevenue,
                        totalOrders,
                        totalUsers,
                        newUsersLast30Days,
                        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
                        conversionRate: `${conversionRate}%`,
                        pendingOrders
                    },
                    viewMoreUrl: '/analytics'
                },
                notifications: {
                    title: 'Recent Notifications',
                    description: 'Latest email and SMS notifications sent',
                    data: processedNotifications,
                    total: await Notification.countDocuments(),
                    viewMoreUrl: '/notifications'
                },
                users: {
                    title: 'Recent Users',
                    description: 'Newly registered users',
                    data: processedUsers,
                    total: totalUsers,
                    newLast30Days: newUsersLast30Days,
                    viewMoreUrl: '/users'
                },
                products: {
                    title: 'Popular Products',
                    description: 'Tests and offers with custom pricing',
                    tests: processedTests,
                    offers: processedOffers,
                    totalTests: await Test.countDocuments(),
                    totalOffers: await Offer.countDocuments(),
                    viewMoreUrl: '/offers' // Could be products management page
                },
                system: {
                    title: 'System Status',
                    description: 'Current system health and overview',
                    data: {
                        totalOrders,
                        totalUsers,
                        totalRevenue,
                        pendingOrders,
                        todaysOrders,
                        newUsersLast30Days,
                        uptime: process.uptime()
                    },
                    viewMoreUrl: '/settings'
                }
            }
        });

    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('Dashboard fetch error:', error);

        // Log error activity (skip for staff)
        const { adminId: eAdminId, sessionId: eSessionId } = getAdminContext(auth);
        if (eAdminId) await AdminActivity.logActivity({
            adminId: eAdminId,
            sessionId: eSessionId,
            action: 'ERROR',
            description: `Failed to fetch dashboard data: ${error.message}`,
            resource: 'dashboard',
            endpoint: '/api/admin/dashboard',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message
        });

        return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
