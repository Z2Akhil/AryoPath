'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from "@/providers/AdminAuthProvider";
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import AdminMobileDrawer from '@/components/layout/AdminMobileDrawer';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [productOpen, setProductOpen] = useState(false);

    // Load sidebar state from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('adminSidebarCollapsed');
            if (savedState !== null) {
                setSidebarCollapsed(JSON.parse(savedState));
            }
        }
    }, []);

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
        }
    }, [sidebarCollapsed]);

    if (isLoginPage) {
        return (
            <AdminAuthProvider>
                {children}
            </AdminAuthProvider>
        );
    }

    const getTitle = () => {
        if (pathname === '/admin') return 'Home';
        if (pathname.includes('/analytics')) return 'Analytics';
        if (pathname.includes('/orders')) return 'Orders';
        if (pathname.includes('/packages')) return 'Packages';
        if (pathname.includes('/offers')) return 'Offers';
        if (pathname.includes('/tests')) return 'Tests';
        if (pathname.includes('/users')) return 'Users';
        if (pathname.includes('/notifications')) return 'Notifications';
        if (pathname.includes('/account')) return 'Account';
        if (pathname.includes('/settings')) return 'Settings';
        if (pathname.includes('/medicines')) return 'Medicines';
        if (pathname.includes('/doctors')) return 'Doctors';
        return 'Dashboard';
    };

    return (
        <AdminAuthProvider>
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    productOpen={productOpen}
                    onToggleProduct={() => setProductOpen(!productOpen)}
                />

                <div className="flex flex-col flex-1 overflow-hidden">
                    <AdminHeader
                        onMenuClick={() => setSidebarOpen(true)}
                        title={getTitle()}
                    />

                    <main className="flex-1 bg-gray-50 overflow-auto p-6">
                        {children}
                    </main>
                </div>

                <AdminMobileDrawer
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    productOpen={productOpen}
                    toggleProduct={() => setProductOpen(!productOpen)}
                />
            </div>
        </AdminAuthProvider>
    );
}
