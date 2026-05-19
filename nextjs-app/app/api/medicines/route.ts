import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Medicine from '@/lib/models/Medicine';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit       = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12')));
    const search      = searchParams.get('search')?.trim() ?? '';
    const category    = searchParams.get('category')?.trim() ?? '';
    const type        = searchParams.get('type')?.trim() ?? '';
    const rxOnly      = searchParams.get('rxOnly');       // 'true' | 'false' | null
    const inStock     = searchParams.get('inStock');      // 'true' | null
    const hasDiscount = searchParams.get('hasDiscount');  // 'true' | null
    const minPrice    = parseFloat(searchParams.get('minPrice') ?? '0');
    const maxPrice    = parseFloat(searchParams.get('maxPrice') ?? '0');

    // Build MongoDB filter
    const filter: Record<string, any> = {
      isPublished: true,
      isDeleted: { $ne: true },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { saltComposition: { $regex: search, $options: 'i' } },
        { madeBy: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (rxOnly === 'true') filter.prescriptionRequired = true;
    if (rxOnly === 'false') filter.prescriptionRequired = false;
    if (inStock === 'true') filter.inStock = true;
    if (hasDiscount === 'true') filter.discountPercentage = { $gt: 0 };

    if (minPrice > 0 || maxPrice > 0) {
      filter.offerPrice = {};
      if (minPrice > 0) filter.offerPrice.$gte = minPrice;
      if (maxPrice > 0) filter.offerPrice.$lte = maxPrice;
    }

    const skip = (page - 1) * limit;
    const [medicines, total] = await Promise.all([
      Medicine.find(filter)
        .select('name slug type category mrp offerPrice discountPercentage thumbnail stockQuantity inStock prescriptionRequired madeBy packSize shortDescription isPublished')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Medicine.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: medicines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch medicines';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
