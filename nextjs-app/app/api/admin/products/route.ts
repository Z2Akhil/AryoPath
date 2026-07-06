export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import { syncThyrocareProducts } from '@/lib/services/productSync';

// In-memory locks to prevent concurrent syncs for the same product type
const syncLocks: Record<string, boolean> = {};

export async function GET(req: NextRequest) {
    // Lab receipt staff also need to read the catalog (products + prices) to build receipts.
    const auth = await adminOrStaffAuth(req, [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.LAB_RECEIPT_VIEW]);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    try {
            const { searchParams } = new URL(req.url);
            const typeParam = searchParams.get('type');

            if (!typeParam) {
                return NextResponse.json({ success: false, error: 'Product type query parameter is required' }, { status: 400 });
            }

            const type = typeParam.toUpperCase();

            let rawProducts: any[] = [];

            if (type === 'ALL') {
                const tests = await Test.find({}).lean();
                const profiles = await Profile.find({}).lean();
                const offers = await Offer.find({}).lean();

                rawProducts = [
                    ...tests.map(t => ({ ...t, type: t.type || 'TEST' })),
                    ...profiles.map(p => ({ ...p, type: p.type || 'PROFILE' })),
                    ...offers.map(o => ({ ...o, type: o.type || 'OFFER' }))
                ];
            } else {
                let model: typeof Test | typeof Profile | typeof Offer = Test;
                if (type === 'PROFILE' || type === 'POP') model = Profile;
                else if (type === 'OFFER') model = Offer;

                // Query the model directly without filtering by 'type' field
                // Each model is type-specific (Test, Profile, Offer)
                // Filtering by type would miss products like POP stored in the Profile model
                // @ts-expect-error - Mongoose query type complexity
                rawProducts = await model.find({}).lean();
            }

            // Map raw database objects to the flattened structure expected by AdminTable
            const allProducts = rawProducts.map((doc: any) => {
                const thyrocareRate = doc.thyrocareData?.rate?.b2C || 0;
                const thyrocareMargin = doc.thyrocareData?.margin || 0;
                const discount = doc.customPricing?.discount || 0;
                const sellingPrice = doc.customPricing?.sellingPrice || thyrocareRate;

                return {
                    ...doc,
                    thyrocareRate,
                    thyrocareMargin,
                    category: doc.thyrocareData?.category,
                    discount,
                    sellingPrice,
                    isCustomized: doc.customPricing?.isCustomized || false,
                    actualMargin: thyrocareMargin - (thyrocareRate - sellingPrice),
                    isActive: doc.isActive !== false,
                    isInThyrocare: doc.isInThyrocare !== false,
                    customImage: (doc as any).customImage?.url ? (doc as any).customImage : null,
                };
            });

            return NextResponse.json({
                success: true,
                products: allProducts,
                metadata: {
                    totalProducts: allProducts.length,
                }
            });
        } catch (error) {
            console.error('Fetch Admin Products Error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error fetching products';
            return NextResponse.json({ success: false, error: message }, { status: 500 });
        }
}

export async function POST(req: NextRequest) {
    return withAdminAuth(req, async (req, session) => {
        const startTime = Date.now();
        const { productType } = await req.json();

        if (!productType) {
            return NextResponse.json({ success: false, error: 'Product type is required' }, { status: 400 });
        }

        const typeStr = productType.toString().toUpperCase();

        // Check if sync is already in progress for this type
        if (syncLocks[typeStr]) {
            return NextResponse.json({
                success: false,
                error: `A sync operation for ${typeStr} is already in progress. Please wait and try again.`
            }, { status: 429 });
        }

        try {
            // Acquire lock
            syncLocks[typeStr] = true;

            const { products: allProducts, synced, orphaned } = await syncThyrocareProducts(productType);

            await AdminActivity.logActivity({
                adminId: session.adminId._id,
                sessionId: session._id,
                action: 'PRODUCT_FETCH',
                description: `Fetched ${productType} products (Sync: ${synced}, Orphaned: ${orphaned})`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: { productType, total: allProducts.length, synced, orphaned }
            });

            return NextResponse.json({
                success: true,
                products: allProducts,
                metadata: {
                    totalProducts: allProducts.length,
                    syncedCount: synced,
                    orphanedCount: orphaned
                }
            });

        } catch (error) {
            console.error('Migration API Error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return NextResponse.json({ success: false, error: message }, { status: 500 });
        } finally {
            // Release lock
            if (productType) {
                const typeStr = productType.toString().toUpperCase();
                delete syncLocks[typeStr];
            }
        }
    });
}