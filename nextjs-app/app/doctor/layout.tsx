'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DoctorAuthProvider, useDoctorAuth } from '@/providers/DoctorAuthProvider';

function DoctorSidebar() {
    const { doctor, logout } = useDoctorAuth();
    const pathname = usePathname();

    const navItems = [
        { label: 'Dashboard',    href: '/doctor' },
        { label: 'Appointments', href: '/doctor/appointments' },
        { label: 'My Profile',   href: '/doctor/profile' },
    ];

    return (
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col min-h-screen">
            <div className="px-5 py-5 border-b border-gray-100">
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Doctor Portal</p>
                <p className="text-sm font-medium text-gray-800 mt-1 truncate">{doctor?.name}</p>
                <p className="text-xs text-gray-400 truncate">{doctor?.specialization}</p>
            </div>

            <nav className="flex-1 py-4 space-y-1 px-3">
                {navItems.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === item.href
                                ? 'bg-teal-50 text-teal-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="px-5 py-3 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
}

function DoctorShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <DoctorSidebar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    return (
        <DoctorAuthProvider>
            <DoctorShell>{children}</DoctorShell>
        </DoctorAuthProvider>
    );
}
