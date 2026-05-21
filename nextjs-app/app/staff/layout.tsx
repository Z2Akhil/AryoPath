'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { StaffAuthProvider, useStaffAuth } from '@/providers/StaffAuthProvider';
import { PERMISSIONS, Permission } from '@/lib/constants/permissions';

function StaffSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const { staff, hasPermission, logout } = useStaffAuth();
    const pathname = usePathname();

    const navItems: { label: string; href: string; permission?: Permission }[] = [
        { label: 'Dashboard', href: '/staff' },
        { label: 'Orders',    href: '/staff/orders',    permission: PERMISSIONS.ORDERS_VIEW },
        { label: 'Medicines', href: '/staff/medicines', permission: PERMISSIONS.MEDICINES_VIEW },
        { label: 'Products',  href: '/staff/products',  permission: PERMISSIONS.PRODUCTS_VIEW },
        { label: 'Users',     href: '/staff/users',     permission: PERMISSIONS.USERS_VIEW },
        { label: 'Doctors',   href: '/staff/doctors',   permission: PERMISSIONS.DOCTORS_VIEW },
    ];

    const visible = navItems.filter(item => !item.permission || hasPermission(item.permission));

    return (
        <aside className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-200 bg-white border-r border-gray-200 flex flex-col min-h-screen`}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                {!collapsed && <span className="font-semibold text-gray-800 text-sm">Staff Portal</span>}
                <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 px-2">
                {visible.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === item.href
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <span className="truncate">{!collapsed ? item.label : item.label[0]}</span>
                    </Link>
                ))}
            </nav>

            <div className="px-4 py-3 border-t border-gray-100">
                {!collapsed && <p className="text-xs text-gray-500 mb-2 truncate">{staff?.name}</p>}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full"
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}

function StaffShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <StaffSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <StaffAuthProvider>
            <StaffShell>{children}</StaffShell>
        </StaffAuthProvider>
    );
}
