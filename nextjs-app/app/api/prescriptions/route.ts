import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import Prescription from '@/lib/models/Prescription';
import { uploadBuffer, FOLDERS } from '@/lib/cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE  = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5;
const MAX_OPEN_REQUESTS = 10;       // anti-spam: max pending prescriptions per user

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer', '').trim() ?? null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
    return await User.findById(decoded.id).select('_id isActive isVerified mobileNumber email');
  } catch {
    return null;
  }
}

// POST /api/prescriptions — logged-in user uploads a medicine prescription (1–5 files) + contact.
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUser(req);
    if (!user || !user.isActive || !user.isVerified) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Anti-spam: cap open (pending) requests per user
    const openCount = await Prescription.countDocuments({ userId: user._id, status: 'pending' });
    if (openCount >= MAX_OPEN_REQUESTS) {
      return NextResponse.json(
        { success: false, message: 'You have too many pending prescription requests. Please wait for our team to process them.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    const contactMobile = String(formData.get('contactMobile') ?? '').trim();
    const contactEmail  = String(formData.get('contactEmail') ?? '').trim();
    const note          = String(formData.get('note') ?? '').trim();

    // ── Validation ──
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: 'Please upload at least one prescription file' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ success: false, message: `You can upload a maximum of ${MAX_FILES} files` }, { status: 400 });
    }
    if (!/^\d{10}$/.test(contactMobile)) {
      return NextResponse.json({ success: false, message: 'A valid 10-digit mobile number is required' }, { status: 400 });
    }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address' }, { status: 400 });
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, message: 'Only JPG, PNG, and PDF files are allowed' }, { status: 400 });
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ success: false, message: 'Each file must be under 10MB' }, { status: 400 });
      }
    }

    // ── Upload all files to Cloudinary ──
    const uploaded = await Promise.all(
      files.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadBuffer(buffer, {
          folder: FOLDERS.PRESCRIPTIONS,
          resourceType: file.type === 'application/pdf' ? 'auto' : 'image',
          publicId: `rx_${(user as any)._id}_${Date.now()}_${i}`,
        });
        return { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
      })
    );

    // ── Create the intake record ──
    const prescription = await Prescription.create({
      userId: user._id,
      files: uploaded,
      contactMobile,
      contactEmail: contactEmail || undefined,
      note: note || undefined,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Prescription submitted. Our team will contact you shortly.',
      prescriptionId: prescription._id,
    });
  } catch (error) {
    console.error('[prescriptions] upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit prescription';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
