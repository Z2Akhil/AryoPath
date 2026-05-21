import { doctorAxios } from './doctorAxios';
import { DoctorAuthData, DoctorLoginResponse, DoctorPortalProfile } from '@/types/doctor';

function decodeJwtExp(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000;
    } catch {
        return 0;
    }
}

class DoctorAuthService {
    async login(username: string, password: string): Promise<DoctorLoginResponse> {
        try {
            const response = await doctorAxios.post('/doctor/login', { username, password });
            if (response.data.success && response.data.token) {
                this.storeAuthData({
                    token:     response.data.token,
                    expiresAt: decodeJwtExp(response.data.token),
                    doctor:    response.data.doctor,
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

    storeAuthData(data: DoctorAuthData): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('doctor_auth', JSON.stringify(data));
        }
    }

    getStoredAuthData(): DoctorAuthData | null {
        if (typeof window === 'undefined') return null;
        try {
            const stored = localStorage.getItem('doctor_auth');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    clearAuthData(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('doctor_auth');
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

    getDoctor(): DoctorPortalProfile | null {
        const data = this.getStoredAuthData();
        return data?.doctor ?? null;
    }
}

export const doctorAuthService = new DoctorAuthService();
