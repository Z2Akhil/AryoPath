import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import { adminOrStaffAuth } from '@/lib/auth';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';
import { PERMISSIONS } from '@/lib/constants/permissions';

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await adminOrStaffAuth(req, PERMISSIONS.MEDICINES_VIEW);
        if (!auth.authenticated) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const now        = new Date();
        const today      = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const [
            totalOrders,
            ordersToday,
            ordersMonth,
            byStatus,
            revenueAll,
            revenueMonth,
            topMedicines,
            lowStock,
            trend,
        ] = await Promise.all([
            MedicineOrder.countDocuments({}),

            MedicineOrder.countDocuments({ createdAt: { $gte: today } } as any),

            MedicineOrder.countDocuments({ createdAt: { $gte: monthStart } } as any),

            MedicineOrder.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),

            MedicineOrder.aggregate([
                { $match: { 'payment.status': 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ]),

            MedicineOrder.aggregate([
                { $match: { 'payment.status': 'paid', createdAt: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ]),

            // Top 5 medicines by units sold
            MedicineOrder.aggregate([
                { $match: { status: { $nin: ['cancelled', 'refunded', 'pending_payment', 'payment_failed'] } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id:      '$items.medicineId',
                        name:     { $first: '$items.name' },
                        slug:     { $first: '$items.slug' },
                        unitsSold: { $sum: '$items.qty' },
                        revenue:  { $sum: { $multiply: ['$items.offerPrice', '$items.qty'] } },
                    }
                },
                { $sort: { unitsSold: -1 } },
                { $limit: 5 },
            ]),

            // Low stock medicines
            Medicine.find({
                $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
                inStock: true,
                isPublished: true,
            } as any)
                .select('name slug stockQuantity lowStockThreshold')
                .limit(10)
                .lean()
                .catch(() => [] as any[]),

            // Last 7 days revenue trend
            MedicineOrder.aggregate([
                { $match: { 'payment.status': 'paid', createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' }
                        },
                        revenue: { $sum: '$totalAmount' },
                        orders:  { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        // Also try raw $expr for low stock
        const lowStockRaw = await Medicine.find({
            $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
            inStock: true,
            isPublished: true,
        }).select('name slug stockQuantity lowStockThreshold').limit(10).lean();

        const statusMap = Object.fromEntries(byStatus.map((b: any) => [b._id, b.count]));
        const totalRevenue  = revenueAll[0]?.total    || 0;
        const totalPaidCount = revenueAll[0]?.count   || 0;
        const monthRevenue  = revenueMonth[0]?.total  || 0;
        const avgOrderValue = totalPaidCount > 0 ? Math.round(totalRevenue / totalPaidCount) : 0;

        // Fill missing days in trend
        const trendMap = Object.fromEntries(trend.map((t: any) => [t._id, t]));
        const trendFilled: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(sevenDaysAgo.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            trendFilled.push({ date: key, revenue: trendMap[key]?.revenue || 0, orders: trendMap[key]?.orders || 0 });
        }

        return NextResponse.json({
            success: true,
            stats: {
                totalOrders,
                ordersToday,
                ordersMonth,
                totalRevenue,
                monthRevenue,
                avgOrderValue,
                byStatus: statusMap,
                topMedicines,
                lowStock: lowStockRaw.length > 0 ? lowStockRaw : lowStock,
                trend: trendFilled,
            },
        });
    } catch (error) {
        console.error('Error fetching medicine dashboard:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch medicine dashboard' }, { status: 500 });
    }
}
