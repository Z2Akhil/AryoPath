import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import Medicine from '@/lib/models/Medicine';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;

    const medicine = await Medicine.findOne({
      slug,
      isPublished: true,
      isDeleted: { $ne: true },
    }).lean();

    if (!medicine) {
      return NextResponse.json({ success: false, message: 'Medicine not found' }, { status: 404 });
    }

    // Fetch related medicines (same category, exclude current)
    const related = await Medicine.find({
      category: (medicine as any).category,
      _id: { $ne: (medicine as any)._id },
      isPublished: true,
      isDeleted: { $ne: true },
    })
      .select('name slug type mrp offerPrice discountPercentage thumbnail inStock prescriptionRequired madeBy packSize')
      .limit(6)
      .lean();

    return NextResponse.json({ success: true, data: medicine, related });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch medicine';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
