'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import adminAuthService from '@/lib/api/adminAuthService';
import { staffAuthService } from '@/lib/api/staffAuthService';
import { AdminUser, AdminProfile } from '@/types/admin';
import { StaffProfile } from '@/types/staff';
import { Permission } from '@/lib/constants/permissions';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    isStaff: boolean;
    user: AdminUser | StaffProfile | null;
    permissions: Permission[];
    hasPermission: (p: Permission) => boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    refreshAuth: () => void;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [user, setUser] = useState<AdminUser | StaffProfile | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            // Admin auth takes priority
            if (adminAuthService.isAuthenticated()) {
                const authData = adminAuthService.getStoredAuthData();
                setIsAuthenticated(true);
                setIsAdmin(true);
                setIsStaff(false);
                setPermissions([]);
                setUser({
                    username: authData?.username || 'Admin',
                    loginTime: authData?.timestamp || '',
                    adminProfile: authData?.adminProfile as AdminProfile,
                });
                return;
            }

            // Fall back to staff auth
            if (staffAuthService.isAuthenticated()) {
                const staffData = staffAuthService.getStoredAuthData();
                if (staffData?.staff) {
                    setIsAuthenticated(true);
                    setIsAdmin(false);
                    setIsStaff(true);
                    setPermissions(staffData.staff.permissions ?? []);
                    setUser(staffData.staff);
                    return;
                }
            }

            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsStaff(false);
            setUser(null);
            setPermissions([]);
        } catch (err) {
            console.error('Auth status check failed:', err);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await adminAuthService.login(username, password);
            if (result.success) {
                setIsAuthenticated(true);
                setIsAdmin(true);
                setIsStaff(false);
                setPermissions([]);
                setUser({
                    username,
                    loginTime: result.timestamp || new Date().toISOString(),
                    adminProfile: result.adminProfile as AdminProfile,
                });
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
        if (isAdmin) {
            adminAuthService.clearAuthData();
        } else if (isStaff) {
            staffAuthService.clearAuthData();
        }
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsStaff(false);
        setUser(null);
        setPermissions([]);
        setError(null);
        router.push('/admin/login');
    };

    const hasPermission = (p: Permission): boolean => {
        if (isAdmin) return true;
        return permissions.includes(p);
    };

    const refreshAuth = () => checkAuthStatus();

    const clearError = () => setError(null);

    // Route guard
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated && !pathname.includes('/admin/login')) {
                router.push('/admin/login');
            } else if (isAuthenticated && pathname.includes('/admin/login')) {
                router.push('/admin');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const value: AuthContextType = {
        isAuthenticated,
        isLoading,
        isAdmin,
        isStaff,
        user,
        permissions,
        hasPermission,
        error,
        login,
        refreshAuth,
        logout,
        clearError,
    };

    const isRedirectingToLogin = !isLoading && !isAuthenticated && !pathname.includes('/admin/login');
    const isRedirectingToDashboard = !isLoading && isAuthenticated && pathname.includes('/admin/login');
    const shouldShowLoader = isLoading || isRedirectingToLogin || isRedirectingToDashboard;

    return (
        <AuthContext.Provider value={value}>
            {shouldShowLoader ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
