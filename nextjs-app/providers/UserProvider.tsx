'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserContextType } from '@/types';
import { authApi } from '@/lib/api/authApi';

const UserContext = createContext<UserContextType | undefined>(undefined);

const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'An error occurred';
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                return null;
            }
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try { return JSON.parse(savedUser); } catch { return null; }
            }
        }
        return null;
    });
    const [loading] = useState(false);

    const setSession = (u: User, token: string) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('authToken', token);
    };

    const requestOTP = async (mobileNumber: string, purpose: string = 'login') => {
        try {
            const result = await authApi.requestOTP(mobileNumber, purpose);
            return { success: result.success, message: result.message, verificationId: result.verificationId };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    // Verify OTP → always sets session (new users are auto-created on the backend).
    // Returns { success, isNewUser } — caller shows "complete profile" nudge if isNewUser.
    const loginWithOTP = async (mobileNumber: string, otp: string) => {
        try {
            const result = await authApi.otpLogin(mobileNumber, otp);
            if (result.success && result.user && result.token) {
                setSession(result.user, result.token);
                return { success: true, isNewUser: !!result.isNewUser };
            }
            return { success: false, message: result.message || 'Login failed' };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    // Complete registration for new users
    const registerWithOTP = async (mobileNumber: string, firstName: string, email?: string) => {
        try {
            const result = await authApi.otpRegister(mobileNumber, firstName, email);
            if (result.success && result.user && result.token) {
                setSession(result.user, result.token);
                return { success: true };
            }
            return { success: false, message: result.message || 'Registration failed' };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        setUser(null);
    };

    useEffect(() => {
        const handleExpiry = () => logout();
        window.addEventListener('auth:session-expired', handleExpiry);
        return () => window.removeEventListener('auth:session-expired', handleExpiry);
    }, []);

    const updateProfile = async (data: Partial<User>) => {
        try {
            const result = await authApi.updateProfile(data);
            if (result.success && result.user) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
            }
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to update profile' };
        }
    };

    const value: UserContextType = {
        user,
        loading,
        loginWithOTP,
        registerWithOTP,
        requestOTP,
        logout,
        updateProfile,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
