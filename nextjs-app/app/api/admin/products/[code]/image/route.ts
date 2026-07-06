export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminOrStaffAuth } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants/permissions';
import connectDB from '@/lib/db/mongoose';
import { uploadBuffer, deleteFromCloudinary, FOLDERS } from '@/lib/cloudinary';
import mongoose from 'mongoose';

type Params = { params: Promise<{ code: string }> };
type ProductColl = 'tests' | 'profiles' | 'offers';

// Cloudinary folder per product type (profiles are shown as "Packages" in the UI)
const FOLDER_BY_COLLECTION: Record<ProductColl, string> = {
    tests:    FOLDERS.THYROCARE_TESTS,
    profiles: FOLDERS.THYROCARE_PACKAGES,
    offers:   FOLDERS.THYROCARE_OFFERS,
};

async function resolveCollection(code: string): Promise<ProductColl | null> {
    const test = await mongoose.connection.collection('tests').findOne({ code }, { projection: { _id: 1 } });
    if (test) return 'tests';
    const profile = await mongoose.connection.collection('profiles').findOne({ code }, { projection: { _id: 1 } });
    if (profile) return 'profiles';
    const offer = await mongoose.connection.collection('offers').findOne({ code }, { projection: { _id: 1 } });
    if (offer) return 'offers';
    return null;
}

// PATCH — upload or replace image (profile or offer)
export async function PATCH(req: NextRequest, { params }: Params) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_EDIT);
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

        const collection = await resolveCollection(code);
        if (!collection) {
            return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Route to the type-specific folder: tests → tests/, profiles → packages/, offers → offers/
        const result = await uploadBuffer(buffer, {
            folder: FOLDER_BY_COLLECTION[collection],
            publicId: `${collection}_${code.toLowerCase()}`,
            resourceType: 'image',
        });

        await mongoose.connection.collection(collection).updateOne(
            { code },
            { $set: { customImage: { url: result.url, publicId: result.publicId } } }
        );

        return NextResponse.json({ success: true, url: result.url, publicId: result.publicId });

    } catch (err: any) {
        console.error('[product image upload]', err);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}

// DELETE — remove custom image
export async function DELETE(req: NextRequest, { params }: Params) {
    const auth = await adminOrStaffAuth(req, PERMISSIONS.PRODUCTS_EDIT);
    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { code } = await params;

    try {
        await connectDB();

        const collection = await resolveCollection(code);
        if (!collection) {
            return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
        }

        const doc = await mongoose.connection.collection(collection)
            .findOne({ code }, { projection: { customImage: 1 } });

        const publicId = doc?.customImage?.publicId;
        if (publicId) {
            await deleteFromCloudinary(publicId).catch(() => {});
        }

        await mongoose.connection.collection(collection).updateOne(
            { code },
            { $unset: { customImage: '' } }
        );

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('[product image delete]', err);
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
}
