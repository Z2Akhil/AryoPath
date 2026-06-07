export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import Admin from '@/lib/models/Admin';
import AdminSession from '@/lib/models/AdminSession';
import { handleExistingSession, handleThyroCareLogin } from '@/lib/api/adminAuth';

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await dbConnect();

        // Clone request so we can read body multiple times if needed by handlers
        // Wait, Next.js Request body can't be read twice easily. 
        // Let's read it here once.
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({
                success: false,
                error: 'Username and password are required'
            }, { status: 400 });
        }

        // Step 1: Check if admin exists in our database
        const existingAdmin = await (Admin as any).findByUsername(username);

        if (existingAdmin && existingAdmin.password) {
            const isPasswordValid = await existingAdmin.verifyPassword(password);

            if (!isPasswordValid) {
                return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
            }

            // Step 2: Check for active sessions
            const sameIpSession = await AdminSession.findOne({
                adminId: existingAdmin._id,
                ipAddress: ipAddress,
                isActive: true,
                apiKeyExpiresAt: { $gt: new Date() }
            });

            if (sameIpSession) {
                return await handleExistingSession(existingAdmin, sameIpSession, req, startTime, ipAddress, userAgent, username, password);
            }

            // Password valid but no active session — fall through to Thyrocare for fresh key
        }

        // Step 3: Fallback to ThyroCare API
        return await handleThyroCareLogin(req, startTime, ipAddress, userAgent, username, password);

    } catch (error: any) {
        console.error('Admin login API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'An unexpected error occurred during login'
        }, { status: 500 });
    }
}
