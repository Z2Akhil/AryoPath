export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth, getAdminContext } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

export async function PUT(req: NextRequest) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_EDIT);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const startTime = Date.now();
    const { code, discount } = await req.json();

    if (!code || discount === undefined) {
        return NextResponse.json({ success: false, error: 'Code and discount are required' }, { status: 400 });
    }

    try {
        let updatedProduct;
        let found = false;

        // Try Test model
        try {
            updatedProduct = await Test.updateCustomPricing(code, discount);
            found = true;
        } catch {
            // Not found in Test, continue
        }

        // Try Profile model
        if (!found) {
            try {
                updatedProduct = await Profile.updateCustomPricing(code, discount);
                found = true;
            } catch {
                // Not found in Profile, continue
            }
        }

        // Try Offer model
        if (!found) {
            try {
                updatedProduct = await Offer.updateCustomPricing(code, discount);
                found = true;
            } catch {
                // Not found in Offer
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
                action: 'PRICING_UPDATE',
                description: `Updated pricing for ${code}`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { code, discount }
            });
        }

        return NextResponse.json({ success: true, product: updatedProduct });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
