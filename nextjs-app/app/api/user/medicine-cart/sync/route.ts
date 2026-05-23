import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import MedicineCart from '@/lib/models/MedicineCart';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim();
        if (!token) return NextResponse.json({ success: false }, { status: 401 });

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('_id isActive isVerified');
        if (!user || !user.isActive || !user.isVerified) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const { items } = await req.json();

        await MedicineCart.findOneAndUpdate(
            { userId: user._id },
            { userId: user._id, items: Array.isArray(items) ? items : [] },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
