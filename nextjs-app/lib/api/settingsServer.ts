/**
 * Server-side helper to fetch site settings directly from the DB.
 * Use this in Server Components / page.tsx files (no axios/client needed).
 */
import connectToDatabase from '@/lib/db/mongoose';
import SiteSettingsModel from '@/lib/models/SiteSettings';
import { SiteSettings } from '@/types';

export async function getSettingsServer(): Promise<SiteSettings | null> {
  try {
    await connectToDatabase();
    let settings = await SiteSettingsModel.findOne().lean<SiteSettings>();
    if (!settings) {
      // Create default and return
      const doc = await SiteSettingsModel.create({});
      settings = doc.toObject() as unknown as SiteSettings;
    }
    return settings;
  } catch {
    return null;
  }
}
