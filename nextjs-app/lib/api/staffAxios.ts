import axios from 'axios';

const baseURL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3000/api');

export const staffAxios = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

staffAxios.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('staff_auth');
        if (stored) {
            try {
                const { token } = JSON.parse(stored);
                if (token) config.headers['Authorization'] = `Bearer ${token}`;
            } catch { /* ignore */ }
        }
    }
    return config;
});

staffAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('staff_auth');
                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
                }
            }
        }
        return Promise.reject(error);
    }
);
