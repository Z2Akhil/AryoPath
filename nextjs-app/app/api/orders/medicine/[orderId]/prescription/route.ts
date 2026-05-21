import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineOrder from '@/lib/models/MedicineOrder';

const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return await User.findById(decoded.id).select('_id isActive isVerified').lean();
  } catch {
    return null;
  }
};

// POST /api/orders/medicine/[orderId]/prescription
// User uploads prescription(s) to an existing order that has status prescription_required.
// Does NOT auto-verify — admin still reviews and changes status to prescription_verified.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectToDatabase();
    const { orderId } = await params;

    const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
    const user = await getUserFromToken(token);

    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const order = await MedicineOrder.findOne({ orderId, userId: (user as any)._id });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'prescription_required') {
      return NextResponse.json(
        { success: false, message: 'Prescription can only be added when order status is Prescription Required' },
        { status: 400 }
      );
    }

    const { prescriptions } = await req.json();
    if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'No prescriptions provided' }, { status: 400 });
    }

    const newPrescriptions = prescriptions
      .filter((p: any) => p?.url && p?.publicId)
      .map((p: any) => ({ url: p.url, publicId: p.publicId, uploadedAt: new Date() }));

    if (newPrescriptions.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid prescription data' }, { status: 400 });
    }

    // Append to existing prescriptions (user may upload in multiple rounds)
    (order as any).prescriptions = [...((order as any).prescriptions ?? []), ...newPrescriptions];

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Prescription submitted. Our team will verify and process your order shortly.',
      data: { prescriptions: (order as any).prescriptions },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit prescription';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
