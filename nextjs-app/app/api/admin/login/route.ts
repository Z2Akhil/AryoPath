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

        // Step 2: Fast path — reuse a live session without a Thyrocare round-trip.
        //
        // `admin.password` is only a CACHE of the Thyrocare password, rewritten on every
        // successful upstream login. Thyrocare is the authoritative identity provider, so a
        // mismatch here means the cache is stale (password rotated upstream), NOT that the
        // credentials are wrong. It may therefore skip the fast path but must never reject
        // the login — doing so locks the admin out permanently after any password rotation,
        // recoverable only by editing the database by hand.
        if (existingAdmin && existingAdmin.password && await existingAdmin.verifyPassword(password)) {
            const sameIpSession = await AdminSession.findOne({
                adminId: existingAdmin._id,
                ipAddress: ipAddress,
                isActive: true,
                apiKeyExpiresAt: { $gt: new Date() }
            });

            if (sameIpSession) {
                return await handleExistingSession(existingAdmin, sameIpSession, req, startTime, ipAddress, userAgent, username, password);
            }
        }

        // Step 3: No live session, or the cached hash is stale — ask ThyroCare, which is
        // authoritative. On success it refreshes the cached hash and mints a new session;
        // on genuinely bad credentials it returns 401.
        return await handleThyroCareLogin(req, startTime, ipAddress, userAgent, username, password);

    } catch (error: any) {
        console.error('Admin login API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'An unexpected error occurred during login'
        }, { status: 500 });
    }
}
