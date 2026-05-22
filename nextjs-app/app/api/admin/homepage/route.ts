import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';
import { PERMISSIONS } from '@/lib/constants/permissions';

const SELECT = 'code name isFeatured featuredOrder customPricing thyrocareData.rate';

export async function GET(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.HOMEPAGE_EDIT);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  await connectToDatabase();

  const [profiles, tests, offers] = await Promise.all([
    Profile.find({ isActive: true }).select(SELECT).sort({ featuredOrder: 1, name: 1 }).lean(),
    Test.find({ isActive: true }).select(SELECT).sort({ featuredOrder: 1, name: 1 }).lean(),
    Offer.find({ isActive: true }).select(SELECT).sort({ featuredOrder: 1, name: 1 }).lean(),
  ]);

  const shape = (docs: any[]) =>
    docs.map(d => ({
      code: d.code,
      name: d.name,
      isFeatured: d.isFeatured ?? false,
      featuredOrder: d.featuredOrder ?? 0,
      price: d.customPricing?.sellingPrice || d.thyrocareData?.rate?.offerRate || d.thyrocareData?.rate?.b2C || 0,
    }));

  return NextResponse.json({
    success: true,
    data: { profiles: shape(profiles), tests: shape(tests), offers: shape(offers) },
  });
}

export async function PUT(req: NextRequest) {
  const auth = await adminOrStaffAuth(req, PERMISSIONS.HOMEPAGE_EDIT);
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  await connectToDatabase();

  const body = await req.json();
  const { type, items } = body as {
    type: 'profile' | 'test' | 'offer';
    items: { code: string; featuredOrder: number }[];
  };

  if (!type || !Array.isArray(items)) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const Model = type === 'profile' ? Profile : type === 'test' ? Test : Offer;

  // Reset all items of this type, then mark only the submitted ones as featured
  await (Model as any).updateMany({}, { $set: { isFeatured: false, featuredOrder: 0 } });

  if (items.length > 0) {
    await Promise.all(
      items.map(({ code, featuredOrder }) =>
        (Model as any).updateOne({ code }, { $set: { isFeatured: true, featuredOrder } })
      )
    );
  }

  return NextResponse.json({ success: true });
}
