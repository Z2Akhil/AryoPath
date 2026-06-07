import { adminAxios } from './adminAxios';
import { AuthData, LoginResponse } from '@/types/admin';

class AdminAuthService {
    async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await adminAxios.post('/admin/login', {
                username,
                password,
                portalType: 'DSAPortal',
                userType: 'DSA'
            });

            if (response.data.success && response.data.apiKey) {
                const authData: AuthData = {
                    apiKey: response.data.apiKey,
                    respId: response.data.respId,
                    timestamp: new Date().toISOString(),
                    username: username,
                    adminProfile: response.data.adminProfile,
                    sessionInfo: response.data.sessionInfo
                };

                this.storeAuthData(authData);
                return { success: true, ...response.data };
            } else {
                throw new Error(response.data.error || 'Login failed: Invalid credentials');
            }
        } catch (error: any) {
            if (error.response) {
                throw new Error(error.response.data?.error || 'Invalid username or password');
            } else if (error.request) {
                throw new Error('Network error. Please check your connection.');
            } else {
                throw new Error(error.message || 'Login failed');
            }
        }
    }

    isApiKeyExpired(timestamp: string): boolean {
        if (!timestamp) return true;

        const now = new Date();
        const loginTime = new Date(timestamp);

        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const nowIST = new Date(now.getTime() + istOffset);
        const loginTimeIST = new Date(loginTime.getTime() + istOffset);

        // API key expires at 00:00 IST daily
        return nowIST.getDate() !== loginTimeIST.getDate() ||
            nowIST.getMonth() !== loginTimeIST.getMonth() ||
            nowIST.getFullYear() !== loginTimeIST.getFullYear();
    }

    storeAuthData(authData: AuthData) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('admin_auth', JSON.stringify(authData));
        }
    }

    getStoredAuthData(): AuthData | null {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('admin_auth');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    }

    clearAuthData() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('admin_auth');
        }
    }

    isAuthenticated(): boolean {
        const authData = this.getStoredAuthData();
        if (!authData || !authData.apiKey || !authData.timestamp) {
            return false;
        }
        return !this.isApiKeyExpired(authData.timestamp);
    }

    getCurrentApiKey(): string | null {
        if (!this.isAuthenticated()) return null;
        return this.getStoredAuthData()?.apiKey || null;
    }
}

const adminAuthService = new AdminAuthService();
export default adminAuthService;
