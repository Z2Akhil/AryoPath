export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { withAdminAuth, adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AdminActivity from '@/lib/models/AdminActivity';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import { ThyrocareService } from '@/lib/services/thyrocare';

interface ThyrocareProduct {
    code: string;
    type: string;
    [key: string]: unknown;
}

// In-memory locks to prevent concurrent syncs for the same product type
const syncLocks: Record<string, boolean> = {};

export async function GET(req: NextRequest) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_VIEW);
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

            const thyrocareApiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

            const responseData = await ThyrocareService.makeRequest(async (apiKey) => {
                const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
                    ProductType: productType,
                    ApiKey: apiKey
                });
                return response.data;
            });

            if (responseData.response !== 'Success') {
                throw new Error('Thyrocare API error: ' + responseData.response);
            }

            let thyrocareProducts: ThyrocareProduct[] = [];
            const master = responseData.master || {};
            const type = productType.toUpperCase();

            if (type === 'OFFER') thyrocareProducts = master.offer || master.offers || [];
            else if (type === 'TEST') thyrocareProducts = master.tests || [];
            else if (type === 'PROFILE') thyrocareProducts = master.profile || [];
            else if (type === 'ALL') {
                thyrocareProducts = [...(master.offer || []), ...(master.tests || []), ...(master.profile || [])];
            }

            // Deduplicate products by code to avoid redundant processing and UI key issues
            const uniqueThyrocareProducts = Array.from(
                new Map(thyrocareProducts.map(p => [p.code, p])).values()
            );

            const allProductCodes = new Set(uniqueThyrocareProducts.map((p) => p.code).filter(Boolean));

            const combinedProducts: any[] = [];
            for (const tp of uniqueThyrocareProducts) {
                try {
                    let model: typeof Test | typeof Profile | typeof Offer = Test;
                    if (tp.type === 'PROFILE' || tp.type === 'POP') model = Profile;
                    else if (tp.type === 'OFFER') model = Offer;

                    const product = await (model as typeof Test).findOrCreateFromThyroCare(tp);
                    if (!product.isActive) {
                        product.isActive = true;
                        await product.save();
                    }

                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = true;
                    combinedProducts.push(combinedData);
                } catch {
                    console.error(`Error syncing product ${tp.code}`);
                }
            }

            // Handle orphaned products (in DB but not in ThyroCare)
            const orphanedProducts: Record<string, unknown>[] = [];
            const codesArray = allProductCodes.size > 0 ? Array.from(allProductCodes) : null;

            const handleOrphaned = async (model: typeof Test | typeof Profile | typeof Offer, mType: string) => {
                const filter = {
                    type: mType,
                    ...(codesArray && { code: { $nin: codesArray } })
                };
                // @ts-expect-error - Mongoose query filter type complexity
                const orphaned = await model.find(filter);
                for (const product of orphaned) {
                    if (product.isActive) {
                        product.isActive = false;
                        await product.save();
                    }
                    const combinedData = product.getCombinedData();
                    combinedData.isInThyrocare = false;
                    orphanedProducts.push(combinedData);
                }
            };

            if (type === 'ALL') {
                await handleOrphaned(Test, 'TEST');
                await handleOrphaned(Profile, 'PROFILE');
                await handleOrphaned(Offer, 'OFFER');
            } else if (type === 'TEST') await handleOrphaned(Test, 'TEST');
            else if (type === 'PROFILE') await handleOrphaned(Profile, 'PROFILE');
            else if (type === 'OFFER') await handleOrphaned(Offer, 'OFFER');

            const allProducts = [...combinedProducts, ...orphanedProducts];

            await AdminActivity.logActivity({
                adminId: session.adminId._id,
                sessionId: session._id,
                action: 'PRODUCT_FETCH',
                description: `Fetched ${productType} products (Sync: ${combinedProducts.length}, Orphaned: ${orphanedProducts.length})`,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: {
                    productType,
                    total: allProducts.length,
                    synced: combinedProducts.length,
                    orphaned: orphanedProducts.length
                }
            });

            return NextResponse.json({
                success: true,
                products: allProducts,
                metadata: {
                    totalProducts: allProducts.length,
                    syncedCount: combinedProducts.length,
                    orphanedCount: orphanedProducts.length
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