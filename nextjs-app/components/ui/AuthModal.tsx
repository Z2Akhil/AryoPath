'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LoginForm from '../auth/LoginForm';
import RegisterForm from '../auth/RegisterForm';

interface AuthModalProps {
    onClose: () => void;
    initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialView = 'login' }) => {
    const [view, setView] = useState<'login' | 'register'>(initialView);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
                <div className="px-6 py-10 sm:px-10">
                    {view === 'login' && (
                        <LoginForm
                            onClose={onClose}
                            onSwitchToRegister={() => setView('register')}
                        />
                    )}
                    {view === 'register' && (
                        <RegisterForm
                            onClose={onClose}
                            onSwitchToLogin={() => setView('login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
