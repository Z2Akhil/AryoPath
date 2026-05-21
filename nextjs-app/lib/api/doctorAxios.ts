import axios from 'axios';

const baseURL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3000/api');

export const doctorAxios = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

doctorAxios.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('doctor_auth');
        if (stored) {
            try {
                const { token } = JSON.parse(stored);
                if (token) config.headers['Authorization'] = `Bearer ${token}`;
            } catch { /* ignore */ }
        }
    }
    return config;
});

doctorAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('doctor_auth');
                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
                }
            }
        }
        return Promise.reject(error);
    }
);
