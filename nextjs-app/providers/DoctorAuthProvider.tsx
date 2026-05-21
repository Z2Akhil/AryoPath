'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doctorAuthService } from '@/lib/api/doctorAuthService';
import { DoctorPortalProfile, DoctorLoginResponse } from '@/types/doctor';

interface DoctorAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    doctor: DoctorPortalProfile | null;
    error: string | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    clearError: () => void;
}

const DoctorAuthContext = createContext<DoctorAuthContextType | undefined>(undefined);

export const DoctorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading]             = useState(true);
    const [doctor, setDoctor]                   = useState<DoctorPortalProfile | null>(null);
    const [error, setError]                     = useState<string | null>(null);
    const router   = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            const authenticated = doctorAuthService.isAuthenticated();
            setIsAuthenticated(authenticated);
            if (authenticated) {
                setDoctor(doctorAuthService.getDoctor());
            }
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result: DoctorLoginResponse = await doctorAuthService.login(username, password);
            if (result.success) {
                setIsAuthenticated(true);
                setDoctor(result.doctor!);
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (err: any) {
            const msg = err.message || 'Login failed';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        doctorAuthService.clearAuthData();
        setIsAuthenticated(false);
        setDoctor(null);
        setError(null);
        router.push('/admin/login');
    };

    const clearError = () => setError(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated && !pathname.includes('/admin/login')) {
                router.push('/admin/login');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const isRedirectingToLogin     = !isLoading && !isAuthenticated && !pathname.includes('/admin/login');
    const isRedirectingToDashboard = false;
    const shouldShowLoader         = isLoading || isRedirectingToLogin || isRedirectingToDashboard;

    const value: DoctorAuthContextType = {
        isAuthenticated,
        isLoading,
        doctor,
        error,
        login,
        logout,
        clearError,
    };

    return (
        <DoctorAuthContext.Provider value={value}>
            {shouldShowLoader ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                children
            )}
        </DoctorAuthContext.Provider>
    );
};

export const useDoctorAuth = () => {
    const context = useContext(DoctorAuthContext);
    if (!context) throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
    return context;
};
