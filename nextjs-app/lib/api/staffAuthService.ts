import { staffAxios } from './staffAxios';
import { StaffAuthData, StaffLoginResponse, StaffProfile } from '@/types/staff';

function decodeJwtExp(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000;
    } catch {
        return 0;
    }
}

class StaffAuthService {
    async login(username: string, password: string): Promise<StaffLoginResponse> {
        try {
            const response = await staffAxios.post('/staff/login', { username, password });
            if (response.data.success && response.data.token) {
                this.storeAuthData({
                    token:     response.data.token,
                    expiresAt: decodeJwtExp(response.data.token),
                    staff:     response.data.staff,
                });
                return { success: true, ...response.data };
            }
            throw new Error(response.data.error || 'Login failed');
        } catch (error: any) {
            if (error.response) throw new Error(error.response.data?.error || 'Invalid credentials');
            if (error.request)  throw new Error('Network error. Please check your connection.');
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }

    storeAuthData(data: StaffAuthData): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('staff_auth', JSON.stringify(data));
        }
    }

    getStoredAuthData(): StaffAuthData | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem('staff_auth');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    clearAuthData(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('staff_auth');
        }
    }

    isAuthenticated(): boolean {
        const data = this.getStoredAuthData();
        if (!data?.token) return false;
        return Date.now() < data.expiresAt;
    }

    getToken(): string | null {
        const data = this.getStoredAuthData();
        return data?.token ?? null;
    }

    getStaff(): StaffProfile | null {
        const data = this.getStoredAuthData();
        return data?.staff ?? null;
    }
}

export const staffAuthService = new StaffAuthService();
