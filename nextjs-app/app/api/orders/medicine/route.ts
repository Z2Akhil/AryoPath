import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';
import Medicine from '@/lib/models/Medicine';

const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return await User.findById(decoded.id).select('_id isActive isVerified').lean();
  } catch {
    return null;
  }
};

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MED-${ts}-${rand}`;
};

// POST /api/orders/medicine — create a medicine order (pre-payment, status: pending_payment)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, razorpayOrderId, grandTotal } = body;

    if (!items?.length || !shippingAddress || !razorpayOrderId || !grandTotal) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Validate items against DB
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        const med = await Medicine.findOne({ slug: item.slug, isPublished: true, isDeleted: false }).lean();
        if (!med) throw new Error(`Medicine not found: ${item.slug}`);
        if (!(med as any).inStock) throw new Error(`${(med as any).name} is out of stock`);

        return {
          medicineId: (med as any)._id,
          slug: (med as any).slug,
          name: (med as any).name,
          type: (med as any).type,
          mrp: (med as any).mrp,
          offerPrice: (med as any).offerPrice,
          discountPercentage: (med as any).discountPercentage ?? 0,
          quantity: item.quantity,
          thumbnail: (med as any).thumbnail ?? null,
          prescriptionRequired: (med as any).prescriptionRequired ?? false,
          packSize: (med as any).packSize ?? '',
        };
      })
    );

    const subtotal = enrichedItems.reduce((s: number, i: any) => s + i.mrp * i.quantity, 0);
    const totalAmount = enrichedItems.reduce((s: number, i: any) => s + i.offerPrice * i.quantity, 0);
    const totalDiscount = subtotal - totalAmount;
    const deliveryCharge = totalAmount >= 499 ? 0 : 49;
    const requiresPrescription = enrichedItems.some((i: any) => i.prescriptionRequired);

    // Estimated delivery: 3-5 business days
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const order = await MedicineOrder.create({
      orderId: generateOrderId(),
      userId: (user as any)._id,
      items: enrichedItems,
      shippingAddress,
      payment: {
        razorpayOrderId,
        amount: grandTotal,
        currency: 'INR',
        status: 'pending',
      },
      status: 'pending_payment',
      requiresPrescription,
      subtotal,
      totalDiscount,
      totalAmount,
      deliveryCharge,
      grandTotal: totalAmount + deliveryCharge,
      estimatedDelivery: estimatedDelivery as any,
    });

    const saved = order as any;
    return NextResponse.json({ success: true, data: { _id: saved._id, orderId: saved.orderId } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// GET /api/orders/medicine — list user's medicine orders
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(20, parseInt(searchParams.get('limit') ?? '10'));

    const [orders, total] = await Promise.all([
      MedicineOrder.find({ userId: (user as any)._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      MedicineOrder.countDocuments({ userId: (user as any)._id }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
