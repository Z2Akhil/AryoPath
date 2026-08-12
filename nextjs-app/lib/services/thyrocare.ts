import axios from 'axios';
import Admin from '../models/Admin';
import AdminSession from '../models/AdminSession';
import { thyrocareCircuitBreaker } from '../utils/circuitBreaker';
import { thyrocareRequestQueue } from '../utils/requestQueue';

export class ThyrocareService {
    private static apiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

    /** Last credential failure, exposed so a health endpoint or dashboard can surface it. */
    static lastAuthFailure: { reason: string; at: Date } | null = null;

    /**
     * Every automated Thyrocare path — order booking, catalogue sync, status sync — depends
     * on the .env credentials via refreshApiKeys(). When they stop working, nothing else in
     * the system reports it, so this is the single place that has to be impossible to miss.
     */
    private static alarmCredentialsBroken(reason: string) {
        this.lastAuthFailure = { reason, at: new Date() };
        console.error(
            '\n' +
            '========================================================\n' +
            '  THYROCARE CREDENTIALS REJECTED\n' +
            '  refreshApiKeys() cannot authenticate.\n' +
            '\n' +
            '  DOWN: lab order booking, catalogue sync, status sync.\n' +
            `  REASON: ${reason}\n` +
            '\n' +
            '  FIX: the password was most likely rotated on the\n' +
            '  Thyrocare portal. Update THYROCARE_PASSWORD in .env\n' +
            '  and restart. The admin panel may still log in fine —\n' +
            '  that path uses the typed password, not .env.\n' +
            '========================================================\n'
        );
    }

    static async refreshApiKeys() {
        const apiCall = async () => {
            const username = process.env.THYROCARE_USERNAME;
            const password = process.env.THYROCARE_PASSWORD;

            if (!username || !password) {
                this.alarmCredentialsBroken('THYROCARE_USERNAME / THYROCARE_PASSWORD are not set');
                throw new Error('THYROCARE_AUTH_FAILED: credentials not configured');
            }

            const response = await axios.post(`${this.apiUrl}/api/Login/Login`, {
                username,
                password,
                portalType: 'DSAPortal',
                userType: 'DSA'
            });

            if (response.data.response === 'Success' && response.data.apiKey) {
                this.lastAuthFailure = null;
                const admin = await Admin.findOrCreateFromThyroCare(response.data, username);
                const session = await AdminSession.createSingleActiveSession(admin._id as any, response.data, 'AUTO_REFRESH', 'AUTO_REFRESH_SERVICE');
                return session;
            } else {
                // Env credentials were rejected upstream. Unlike the admin's cached password
                // hash — which self-heals on the next successful panel login — .env never
                // repairs itself, so this stays broken until a human edits it. Make it loud:
                // the symptom (lab bookings failing) can surface up to 24h after the cause
                // (password rotated on the Thyrocare portal, .env not updated).
                this.alarmCredentialsBroken(response.data.response || 'Login rejected');
                throw new Error(`THYROCARE_AUTH_FAILED: ${response.data.response || 'Refresh failed'}`);
            }
        };

        return await thyrocareRequestQueue.enqueue(() => thyrocareCircuitBreaker.execute(apiCall), {
            priority: 'high',
            metadata: { type: 'api_key_refresh' }
        });
    }

    static async getOrRefreshApiKey() {
        const activeSession = await AdminSession.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!activeSession || activeSession.isApiKeyExpired()) {
            const newSession = await this.refreshApiKeys();
            return newSession.thyrocareApiKey;
        }

        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        if (activeSession.apiKeyExpiresAt < oneHourFromNow) {
            const newSession = await this.refreshApiKeys();
            return newSession.thyrocareApiKey;
        }

        return activeSession.thyrocareApiKey;
    }

    static isAuthError(dataOrError: any) {
        if (dataOrError?.response?.status === 401) return true;
        const response = dataOrError?.response?.data?.response || dataOrError?.response || dataOrError?.message || dataOrError;
        const responseStr = (response || '').toString().toLowerCase();
        return responseStr.includes('invalid api key') || responseStr === 'invalid';
    }

    static async makeRequest<T>(apiCallFn: (apiKey: string) => Promise<T>): Promise<T> {
        try {
            const apiKey = await this.getOrRefreshApiKey();
            const result = await apiCallFn(apiKey);

            if (this.isAuthError(result)) {
                throw new Error('Invalid Api Key');
            }

            return result;
        } catch (error) {
            if (this.isAuthError(error)) {
                console.log('🔄 Auth error, refreshing and retrying...');
                const session = await this.refreshApiKeys();
                return await apiCallFn(session.thyrocareApiKey);
            }
            throw error;
        }
    }
}
