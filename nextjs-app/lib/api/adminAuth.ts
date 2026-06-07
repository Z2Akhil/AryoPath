import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import Admin from '@/lib/models/Admin';
import AdminSession from '@/lib/models/AdminSession';
import AdminActivity from '@/lib/models/AdminActivity';
import { thyrocareCircuitBreaker } from '@/lib/utils/circuitBreaker';
import { thyrocareRequestQueue } from '@/lib/utils/requestQueue';

const THYROCARE_API_URL = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

export const handleExistingSession = async (
    admin: any,
    existingSession: any,
    req: NextRequest,
    startTime: number,
    ipAddress: string,
    userAgent: string,
    username?: string,
    password?: string
) => {
    console.log('🔄 Reusing existing session:', {
        sessionId: existingSession._id,
        apiKey: existingSession.thyrocareApiKey.substring(0, 10) + '...',
        admin: admin.name
    });

    if (existingSession.isApiKeyExpired()) {
        return await handleThyroCareLogin(req, startTime, ipAddress, userAgent, username, password);
    }

    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);
    const sessionCreatedIST = new Date(existingSession.createdAt.getTime() + istOffset);

    const hasCrossedMidnight = nowIST.getDate() !== sessionCreatedIST.getDate() ||
        nowIST.getMonth() !== sessionCreatedIST.getMonth() ||
        nowIST.getFullYear() !== sessionCreatedIST.getFullYear();

    if (hasCrossedMidnight) {
        console.log('❌ ThyroCare API key has expired (crossed midnight), forcing fresh ThyroCare API call');
        return await handleThyroCareLogin(req, startTime, ipAddress, userAgent, username, password);
    }

    await existingSession.refreshUsage();

    await AdminActivity.logActivity({
        adminId: admin._id,
        sessionId: existingSession._id,
        action: 'LOGIN',
        description: `Admin ${admin.name} logged in with refreshed session`,
        endpoint: '/api/admin/login',
        method: 'POST',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
            userType: admin.userType,
            respId: admin.respId,
            loginType: 'REFRESHED_SESSION'
        }
    });

    return NextResponse.json({
        success: true,
        apiKey: existingSession.thyrocareApiKey,
        accessToken: existingSession.thyrocareAccessToken,
        respId: existingSession.thyrocareRespId,
        response: 'Success',
        adminProfile: {
            name: admin.name,
            email: admin.email,
            mobile: admin.mobile,
            userType: admin.userType,
            role: admin.role,
            lastLogin: admin.lastLogin,
            loginCount: admin.loginCount,
            status: admin.status ? 'Active' : 'Inactive',
            accountCreated: admin.createdAt,
            thyrocareUserId: admin.thyrocareUserId,
            respId: admin.respId,
            verKey: admin.verKey,
            isPrepaid: admin.isPrepaid,
            trackingPrivilege: admin.trackingPrivilege,
            otpAccess: admin.otpAccess
        },
        sessionInfo: {
            apiKeyExpiresAt: existingSession.apiKeyExpiresAt,
            sessionExpiresAt: existingSession.sessionExpiresAt,
            loginType: 'REFRESHED_SESSION'
        }
    });
};

export const handleThyroCareLogin = async (
    req: NextRequest,
    startTime: number,
    ipAddress: string,
    userAgent: string,
    username?: string,
    password?: string
) => {
    const credentials = {
        username: username,
        password: password
    };

    const apiCall = async () => {
        console.log('🚀 Making ThyroCare API call for login...');
        const response = await axios.post(`${THYROCARE_API_URL}/api/Login/Login`, {
            username: credentials.username,
            password: credentials.password,
            portalType: 'DSAPortal',
            userType: 'DSA'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data.response === 'Login has been blocked, try after some time') {
            throw new Error('Login has been blocked by ThyroCare API. Please try again after some time.');
        }

        if (response.data.response === 'Success' && response.data.apiKey) {
            const thyrocareData = response.data;
            const admin = await (Admin as any).findOrCreateFromThyroCare(thyrocareData, credentials.username);
            await admin.updatePassword(credentials.password);
            const session = await (AdminSession as any).createSingleActiveSession(
                admin._id,
                thyrocareData,
                ipAddress,
                userAgent
            );

            await AdminActivity.logActivity({
                adminId: admin._id,
                sessionId: session._id,
                action: 'LOGIN',
                description: `Admin ${admin.name} logged in with fresh ThyroCare API call`,
                endpoint: '/api/admin/login',
                method: 'POST',
                ipAddress: ipAddress,
                userAgent: userAgent,
                statusCode: 200,
                responseTime: Date.now() - startTime,
                metadata: {
                    userType: thyrocareData.userType,
                    respId: thyrocareData.respId,
                    loginType: 'FRESH_THYROCARE'
                }
            });

            return {
                success: true,
                apiKey: thyrocareData.apiKey,
                accessToken: thyrocareData.accessToken,
                respId: thyrocareData.respId,
                response: thyrocareData.response,
                adminProfile: {
                    name: admin.name,
                    email: admin.email,
                    mobile: admin.mobile,
                    userType: admin.userType,
                    role: admin.role,
                    lastLogin: admin.lastLogin,
                    loginCount: admin.loginCount,
                    status: admin.status ? 'Active' : 'Inactive',
                    accountCreated: admin.createdAt,
                    thyrocareUserId: admin.thyrocareUserId,
                    respId: admin.respId,
                    verKey: admin.verKey,
                    isPrepaid: admin.isPrepaid,
                    trackingPrivilege: admin.trackingPrivilege,
                    otpAccess: admin.otpAccess
                },
                sessionInfo: {
                    apiKeyExpiresAt: session.apiKeyExpiresAt,
                    sessionExpiresAt: session.sessionExpiresAt,
                    loginType: 'FRESH_THYROCARE'
                }
            };
        } else {
            const err: any = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }
    };

    try {
        const result = await thyrocareRequestQueue.enqueue(async () => {
            return await thyrocareCircuitBreaker.execute(apiCall);
        });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('❌ ThyroCare API call failed:', error.message);

        if (error.message.includes('Circuit breaker is OPEN')) {
            return NextResponse.json({ success: false, error: 'ThyroCare API is temporarily unavailable.' }, { status: 503 });
        }

        if (error.statusCode === 401) {
            return NextResponse.json({ success: false, error: error.message }, { status: 401 });
        }

        if (error.response) {
            return NextResponse.json({
                success: false,
                error: error.response.data?.response || 'Login failed: Invalid credentials'
            }, { status: error.response.status });
        }

        return NextResponse.json({ success: false, error: error.message || 'Login failed' }, { status: 500 });
    }
};
