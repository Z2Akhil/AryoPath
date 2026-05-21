import axios from 'axios';

const baseURL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3000/api');

export const adminAxios = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — send x-api-key for admin, Bearer JWT for staff
adminAxios.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const adminStored = localStorage.getItem('admin_auth');
        if (adminStored) {
            try {
                const authData = JSON.parse(adminStored);
                if (authData?.apiKey) {
                    config.headers['x-api-key'] = authData.apiKey;
                    return config;
                }
            } catch {
                // malformed — fall through to staff check
            }
        }

        const staffStored = localStorage.getItem('staff_auth');
        if (staffStored) {
            try {
                const staffData = JSON.parse(staffStored);
                if (staffData?.token) {
                    config.headers['Authorization'] = `Bearer ${staffData.token}`;
                }
            } catch {
                // ignore
            }
        }
    }
    return config;
});

// Response interceptor — smart 401/403 handling
adminAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined') {
            const status = error.response?.status;

            if (status === 401) {
                // Token is invalid or expired — clear it and redirect to login
                const hasAdmin = !!localStorage.getItem('admin_auth');
                const hasStaff = !!localStorage.getItem('staff_auth');

                if (hasAdmin) {
                    localStorage.removeItem('admin_auth');
                } else if (hasStaff) {
                    localStorage.removeItem('staff_auth');
                }

                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
                }
            }
            // 403 = endpoint is admin-only, token is valid → don't redirect, just reject
        }
        return Promise.reject(error);
    }
);
