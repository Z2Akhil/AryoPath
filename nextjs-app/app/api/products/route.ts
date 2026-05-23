import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';

interface ProductWithCombinedData {
  getCombinedData(): Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toUpperCase() || 'ALL';
    const limit = searchParams.get('limit');
    const skip = searchParams.get('skip');

    const search = searchParams.get('search')?.trim() || '';
    const limitNum = limit ? parseInt(limit, 10) : null;
    const skipNum = skip ? parseInt(skip, 10) : 0;

    const searchFilter = search
      ? { isActive: true, name: { $regex: search, $options: 'i' } }
      : { isActive: true };

    let products: Record<string, unknown>[] = [];
    let totalCount = 0;

    switch (type) {
      case 'TESTS':
        totalCount = await Test.countDocuments(searchFilter);
        const testQuery = Test.find(searchFilter).skip(search ? 0 : skipNum);
        if (limitNum && !search) testQuery.limit(limitNum);
        const tests = await testQuery;
        products = tests.map((test) => test.getCombinedData());
        products = Array.from(new Map(products.map(p => [(p as any).code, p])).values());
        break;

      case 'PROFILE':
        totalCount = await Profile.countDocuments(searchFilter);
        const profileQuery = Profile.find(searchFilter).skip(search ? 0 : skipNum);
        if (limitNum && !search) profileQuery.limit(limitNum);
        const profiles = await profileQuery;
        products = profiles.map((profile) => profile.getCombinedData());
        products = Array.from(new Map(products.map(p => [(p as any).code, p])).values());
        break;

      case 'OFFER':
        totalCount = await Offer.countDocuments(searchFilter);
        const offerQuery = Offer.find(searchFilter).skip(search ? 0 : skipNum);
        if (limitNum && !search) offerQuery.limit(limitNum);
        const offers = await offerQuery;
        products = offers.map((offer) => offer.getCombinedData());
        products = Array.from(new Map(products.map(p => [(p as any).code, p])).values());
        break;

      case 'ALL':
      default:
        if (limitNum) {
          const perTypeLimit = Math.ceil(limitNum / 3);
          const [allTests, allProfiles, allOffers, testCount, profileCount, offerCount] = await Promise.all([
            Test.find({ isActive: true }).skip(skipNum).limit(perTypeLimit),
            Profile.find({ isActive: true }).skip(skipNum).limit(perTypeLimit),
            Offer.find({ isActive: true }).skip(skipNum).limit(perTypeLimit),
            Test.countDocuments({ isActive: true }),
            Profile.countDocuments({ isActive: true }),
            Offer.countDocuments({ isActive: true })
          ]);

          totalCount = testCount + profileCount + offerCount;
          products = [
            ...allOffers.map((offer) => offer.getCombinedData()),
            ...allProfiles.map((profile) => profile.getCombinedData()),
            ...allTests.map((test) => test.getCombinedData())
          ];

          // Deduplicate by code to avoid UI key issues
          products = Array.from(new Map(products.map(p => [(p as any).code, p])).values());
          totalCount = products.length; // Update totalCount after deduplication for the paginated case as well
        } else {
          const [allTests, allProfiles, allOffers] = await Promise.all([
            Test.find({ isActive: true }),
            Profile.find({ isActive: true }),
            Offer.find({ isActive: true })
          ]);

          products = [
            ...allOffers.map((offer) => offer.getCombinedData()),
            ...allProfiles.map((profile) => profile.getCombinedData()),
            ...allTests.map((test) => test.getCombinedData())
          ];

          // Deduplicate by code to avoid UI key issues
          products = Array.from(new Map(products.map(p => [(p as any).code, p])).values());
          totalCount = products.length;
        }
        break;
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      totalCount,
      hasMore: totalCount > (skipNum + products.length)
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch products',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}