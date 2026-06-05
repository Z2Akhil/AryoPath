export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import { uploadBuffer, deleteFromCloudinary, FOLDERS } from '@/lib/cloudinary';
import mongoose from 'mongoose';

type Params = { params: Promise<{ code: string }> };

// PATCH — upload or replace package image
export async function PATCH(req: NextRequest, { params }: Params) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_VIEW);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { code } = await params;

    try {
        await connectDB();

        const formData = await req.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Only JPEG, PNG, WebP images allowed' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'Image must be under 5MB' }, { status: 400 });
        }

        // Verify profile exists
        const exists = await Profile.findOne({ code }).lean();
        if (!exists) {
            return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload with stable public_id — Cloudinary overwrites automatically (no orphans)
        const result = await uploadBuffer(buffer, {
            folder: FOLDERS.THYROCARE_PACKAGES,
            publicId: `pkg_${code.toLowerCase()}`,
            resourceType: 'image',
        });

        // Use $set directly to bypass any Mongoose schema cache issues
        await mongoose.connection.collection('profiles').updateOne(
            { code },
            { $set: { customImage: { url: result.url, publicId: result.publicId } } }
        );

        return NextResponse.json({ success: true, url: result.url, publicId: result.publicId });

    } catch (err: any) {
        console.error('[product image upload]', err);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}

// DELETE — remove custom image and delete from Cloudinary
export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_VIEW);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { code } = await params;

    try {
        await connectDB();

        const profile = await mongoose.connection.collection('profiles')
            .findOne({ code }, { projection: { customImage: 1 } });

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
        }

        const publicId = profile.customImage?.publicId;
        if (publicId) {
            await deleteFromCloudinary(publicId).catch(() => {});
        }

        await mongoose.connection.collection('profiles').updateOne(
            { code },
            { $unset: { customImage: '' } }
        );

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[product image delete]', err);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
