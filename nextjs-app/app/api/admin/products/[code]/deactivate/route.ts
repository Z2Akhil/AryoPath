export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_EDIT);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const startTime = Date.now();
    const { code } = await params;

    if (!code) {
        return NextResponse.json({ success: false, error: 'Product code is required' }, { status: 400 });
    }

    try {
        let deactivatedProduct;
        let found = false;

        // Try Test model
        const test = await Test.findOne({ code });
        if (test) {
            test.isActive = false;
            await test.save();
            deactivatedProduct = test.getCombinedData();
            found = true;
        }

        // Try Profile model
        if (!found) {
            const profile = await Profile.findOne({ code });
            if (profile) {
                profile.isActive = false;
                await profile.save();
                deactivatedProduct = profile.getCombinedData();
                found = true;
            }
        }

        // Try Offer model
        if (!found) {
            const offer = await Offer.findOne({ code });
            if (offer) {
                offer.isActive = false;
                await offer.save();
                deactivatedProduct = offer.getCombinedData();
                found = true;
            }
        }

        if (!found) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        // Activity log only for admin sessions (staff have no AdminSession/adminId)
        const ctx = getAdminContext(auth);
        if (ctx.adminId) {
            await AdminActivity.logActivity({
                adminId: ctx.adminId,
                sessionId: ctx.sessionId,
                action: 'PRODUCT_DEACTIVATE',
                description: `Deactivated product ${code}`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { code }
            });
        }

        return NextResponse.json({ success: true, product: deactivatedProduct, message: 'Product deactivated successfully' });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
