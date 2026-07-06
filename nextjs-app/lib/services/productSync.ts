import axios from 'axios';
import { ThyrocareService } from '@/lib/services/thyrocare';
import Test from '@/lib/models/Test';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';

export interface ProductSyncResult {
  products: any[];
  synced: number;
  orphaned: number;
}

// Core Thyrocare catalog sync — fetch products, upsert (refresh thyrocareData, keep
// customPricing/customImage), reactivate returned ones, deactivate orphans.
// Uses ThyrocareService (env creds → Thyrocare API key) — needs NO admin login.
// Shared by the admin manual-sync route AND the nightly cron.
export async function syncThyrocareProducts(productType: string): Promise<ProductSyncResult> {
  const thyrocareApiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

  const responseData = await ThyrocareService.makeRequest(async (apiKey) => {
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: productType,
      ApiKey: apiKey,
    });
    return response.data;
  });

  if (responseData.response !== 'Success') {
    throw new Error('Thyrocare API error: ' + responseData.response);
  }

  const master = responseData.master || {};
  const type = productType.toUpperCase();

  let thyrocareProducts: any[] = [];
  if (type === 'OFFER') thyrocareProducts = master.offer || master.offers || [];
  else if (type === 'TEST') thyrocareProducts = master.tests || [];
  else if (type === 'PROFILE') thyrocareProducts = master.profile || [];
  else if (type === 'ALL') {
    thyrocareProducts = [...(master.offer || []), ...(master.tests || []), ...(master.profile || [])];
  }

  // Dedupe by code
  const unique = Array.from(new Map(thyrocareProducts.map((p: any) => [p.code, p])).values());
  const allCodes = new Set(unique.map((p: any) => p.code).filter(Boolean));

  const combined: any[] = [];
  for (const tp of unique as any[]) {
    try {
      let model: any = Test;
      if (tp.type === 'PROFILE' || tp.type === 'POP') model = Profile;
      else if (tp.type === 'OFFER') model = Offer;

      const product = await model.findOrCreateFromThyroCare(tp);
      if (!product.isActive) {
        product.isActive = true;
        await product.save();
      }
      const cd = product.getCombinedData();
      cd.isInThyrocare = true;
      combined.push(cd);
    } catch {
      console.error(`[productSync] Error syncing product ${tp.code}`);
    }
  }

  // Orphans: in DB but no longer returned by Thyrocare → deactivate
  const orphaned: any[] = [];
  const codesArray = allCodes.size > 0 ? Array.from(allCodes) : null;

  const handleOrphaned = async (model: any, mType: string) => {
    const filter: any = { type: mType, ...(codesArray && { code: { $nin: codesArray } }) };
    const list = await model.find(filter);
    for (const product of list) {
      if (product.isActive) {
        product.isActive = false;
        await product.save();
      }
      const cd = product.getCombinedData();
      cd.isInThyrocare = false;
      orphaned.push(cd);
    }
  };

  if (type === 'ALL') {
    await handleOrphaned(Test, 'TEST');
    await handleOrphaned(Profile, 'PROFILE');
    await handleOrphaned(Offer, 'OFFER');
  } else if (type === 'TEST') await handleOrphaned(Test, 'TEST');
  else if (type === 'PROFILE') await handleOrphaned(Profile, 'PROFILE');
  else if (type === 'OFFER') await handleOrphaned(Offer, 'OFFER');

  return {
    products: [...combined, ...orphaned],
    synced: combined.length,
    orphaned: orphaned.length,
  };
}
