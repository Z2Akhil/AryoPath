'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { staffAuthService } from '@/lib/api/staffAuthService';
import { StaffProfile } from '@/types/staff';
import { Permission } from '@/lib/constants/permissions';

interface StaffAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    staff: StaffProfile | null;
    error: string | null;
    permissions: Permission[];
    hasPermission: (permission: Permission) => boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    clearError: () => void;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading]             = useState(true);
    const [staff, setStaff]                     = useState<StaffProfile | null>(null);
    const [error, setError]                     = useState<string | null>(null);
    const router   = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            const authenticated = staffAuthService.isAuthenticated();
            setIsAuthenticated(authenticated);
            if (authenticated) {
                setStaff(staffAuthService.getStaff());
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
            const result = await staffAuthService.login(username, password);
            if (result.success) {
                setIsAuthenticated(true);
                setStaff(result.staff!);
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
        staffAuthService.clearAuthData();
        setIsAuthenticated(false);
        setStaff(null);
        setError(null);
        router.push('/admin/login');
    };

    const clearError = () => setError(null);

    const permissions: Permission[] = (staff?.permissions ?? []) as Permission[];
    const hasPermission = (permission: Permission) => permissions.includes(permission);

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

    const value: StaffAuthContextType = {
        isAuthenticated,
        isLoading,
        staff,
        error,
        permissions,
        hasPermission,
        login,
        logout,
        clearError,
    };

    return (
        <StaffAuthContext.Provider value={value}>
            {shouldShowLoader ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                children
            )}
        </StaffAuthContext.Provider>
    );
};

export const useStaffAuth = () => {
    const context = useContext(StaffAuthContext);
    if (!context) throw new Error('useStaffAuth must be used within a StaffAuthProvider');
    return context;
};
