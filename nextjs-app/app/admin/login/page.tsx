'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { staffAuthService } from '@/lib/api/staffAuthService';
import { doctorAuthService } from '@/lib/api/doctorAuthService';

type Role = 'admin' | 'staff' | 'doctor';

const ROLE_CONFIG: Record<Role, { label: string; color: string; accent: string; description: string }> = {
    admin:  { label: 'Admin',   color: 'bg-blue-600',  accent: 'focus:ring-blue-500 border-blue-500',  description: 'Full platform access' },
    staff:  { label: 'Staff',   color: 'bg-indigo-600', accent: 'focus:ring-indigo-500 border-indigo-500', description: 'Assigned sections only' },
    doctor: { label: 'Doctor',  color: 'bg-teal-600',  accent: 'focus:ring-teal-500 border-teal-500',  description: 'Your profile & appointments' },
};

export default function UnifiedLoginPage() {
    const router = useRouter();
    const { login: adminLogin, refreshAuth, isLoading: adminLoading, error: adminError, clearError: clearAdminError } = useAdminAuth();

    const [role, setRole]         = useState<Role>('admin');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    // Clear error on input change
    useEffect(() => {
        setError('');
        clearAdminError();
    }, [username, password, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (role === 'admin') {
                const result = await adminLogin(username, password);
                if (!result.success) {
                    setError(result.error || 'Login failed');
                }
                // AdminAuthProvider handles redirect to /admin
            } else if (role === 'staff') {
                const result = await staffAuthService.login(username, password);
                if (result.success) {
                    refreshAuth();
                    // route guard in AdminAuthProvider will push to /admin once isAuthenticated flips
                } else {
                    setError('Invalid credentials');
                }
            } else if (role === 'doctor') {
                const result = await doctorAuthService.login(username, password);
                if (result.success) {
                    router.push('/doctor');
                } else {
                    setError('Invalid credentials');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const isSubmitting = loading || (role === 'admin' && adminLoading);
    const displayError = error || (role === 'admin' ? adminError : '');
    const config = ROLE_CONFIG[role];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-sm space-y-6">
                {/* Logo */}
                <div className="text-center">
                    <div className={`mx-auto h-12 w-12 ${config.color} rounded-full flex items-center justify-center transition-colors duration-200`}>
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">AyroPath</h1>
                    <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                </div>

                {/* Role selector */}
                <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-1">
                    {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                                role === r
                                    ? `${ROLE_CONFIG[r].color} text-white shadow-sm`
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {ROLE_CONFIG[r].label}
                        </button>
                    ))}
                </div>

                {/* Login form */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    {displayError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {displayError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoComplete="username"
                                disabled={isSubmitting}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={isSubmitting}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-2.5 ${config.color} text-white text-sm font-medium rounded-lg transition-opacity disabled:opacity-60 flex items-center justify-center`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : `Sign in as ${config.label}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
