import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Cart from '@/lib/models/Cart';
import MedicineCart from '@/lib/models/MedicineCart';
import { adminOrStaffAuth } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const auth = await adminOrStaffAuth(req, 'users.view');
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { userId } = await params;

    try {
        await connectToDatabase();

        const [cart, medicineCart] = await Promise.all([
            Cart.findOne({ userId, isActive: true }).lean(),
            MedicineCart.findOne({ userId }).lean(),
        ]);

        return NextResponse.json({
            success: true,
            cart: cart ? {
                totalItems:    (cart as any).totalItems,
                totalAmount:   (cart as any).totalAmount,
                totalDiscount: (cart as any).totalDiscount,
                lastUpdated:   (cart as any).lastUpdated,
            } : null,
            items:         (cart as any)?.items || [],
            medicineItems: (medicineCart as any)?.items || [],
        });
    } catch (error) {
        console.error('[GET /api/admin/users/[userId]/cart]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch cart' }, { status: 500 });
    }
}
