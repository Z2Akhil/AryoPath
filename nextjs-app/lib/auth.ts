import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import AdminSession, { AdminSessionDocument } from './models/AdminSession';
import Admin, { AdminDocument } from './models/Admin';
import Staff, { StaffDocument } from './models/Staff';
import Doctor, { DoctorDocument } from './models/Doctor';
import connectToDatabase from './db/mongoose';
import { Permission } from './constants/permissions';

// ─── Admin Auth (Thyrocare API key) ───────────────────────────────────────────

export type AdminAuthResult =
    | { authenticated: false; error: string; status: number; session?: undefined; admin?: undefined }
    | { authenticated: true; session: AdminSessionDocument; admin: AdminDocument; error?: undefined; status?: undefined };

export async function adminAuth(req: NextRequest): Promise<AdminAuthResult> {
    await connectToDatabase();
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return { authenticated: false, error: 'API key is required', status: 401 };
    }

    const session = await AdminSession.findOne({ thyrocareApiKey: apiKey, isActive: true }).populate('adminId');

    if (!session || !session.isValid()) {
        return { authenticated: false, error: 'Invalid or expired API key', status: 401 };
    }

    return {
        authenticated: true,
        session,
        admin: session.adminId as unknown as AdminDocument
    };
}

export async function withAdminAuth(req: NextRequest, handler: (req: NextRequest, session: any) => Promise<NextResponse>) {
    const { session, error, status } = await adminAuth(req);
    if (error) {
        return NextResponse.json({ success: false, error }, { status });
    }
    return await handler(req, session);
}

// ─── Staff Auth (JWT) ─────────────────────────────────────────────────────────

export type StaffAuthResult =
    | { authenticated: false; error: string; status: number; staff?: undefined; permissions?: undefined }
    | { authenticated: true; staff: StaffDocument; permissions: Permission[]; error?: undefined; status?: undefined };

export async function staffAuth(req: NextRequest): Promise<StaffAuthResult> {
    await connectToDatabase();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer', '').trim();

    if (!token) {
        return { authenticated: false, error: 'Token required', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };

        if (decoded.role !== 'staff') {
            return { authenticated: false, error: 'Invalid token type', status: 401 };
        }

        const staff = await Staff.findById(decoded.id);
        if (!staff || !staff.isActive) {
            return { authenticated: false, error: 'Staff not found or inactive', status: 401 };
        }

        return { authenticated: true, staff, permissions: staff.permissions };
    } catch {
        return { authenticated: false, error: 'Invalid or expired token', status: 401 };
    }
}

// ─── Doctor Auth (JWT) ────────────────────────────────────────────────────────

export type DoctorAuthResult =
    | { authenticated: false; error: string; status: number; doctor?: undefined }
    | { authenticated: true; doctor: DoctorDocument; error?: undefined; status?: undefined };

export async function doctorAuth(req: NextRequest): Promise<DoctorAuthResult> {
    await connectToDatabase();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer', '').trim();

    if (!token) {
        return { authenticated: false, error: 'Token required', status: 401 };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };

        if (decoded.role !== 'doctor') {
            return { authenticated: false, error: 'Invalid token type', status: 401 };
        }

        const doctor = await Doctor.findOne({ _id: decoded.id, hasLogin: true, isDeleted: false });
        if (!doctor || !doctor.isActive) {
            return { authenticated: false, error: 'Doctor not found or inactive', status: 401 };
        }

        return { authenticated: true, doctor };
    } catch {
        return { authenticated: false, error: 'Invalid or expired token', status: 401 };
    }
}

// ─── Combined Admin or Staff Auth ─────────────────────────────────────────────

export type AdminOrStaffAuthResult =
    | { authenticated: false; error: string; status: number }
    | { authenticated: true; role: 'admin'; session: AdminSessionDocument; admin: AdminDocument }
    | { authenticated: true; role: 'staff'; staff: StaffDocument; permissions: Permission[] };

export function getAdminContext(auth: (AdminOrStaffAuthResult | AdminAuthResult) & { authenticated: true }) {
    const isAdmin = !('role' in auth) || (auth as any).role === 'admin';
    return {
        adminId:   isAdmin ? (auth as any).admin._id   : undefined,
        sessionId: isAdmin ? (auth as any).session._id : undefined,
    };
}

export async function adminOrStaffAuth(
    req: NextRequest,
    requiredPermission?: Permission | Permission[]
): Promise<AdminOrStaffAuthResult> {
    const adminResult = await adminAuth(req);
    if (adminResult.authenticated) {
        return { authenticated: true, role: 'admin', session: adminResult.session, admin: adminResult.admin };
    }

    const staffResult = await staffAuth(req);
    if (staffResult.authenticated) {
        if (requiredPermission) {
            // Any-of check: staff needs at least one of the required permissions.
            const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
            const allowed = required.some(p => staffResult.permissions.includes(p));
            if (!allowed) {
                return { authenticated: false, error: 'Insufficient permissions', status: 403 };
            }
        }
        return { authenticated: true, role: 'staff', staff: staffResult.staff, permissions: staffResult.permissions };
    }

    return { authenticated: false, error: 'Unauthorized', status: 401 };
}
