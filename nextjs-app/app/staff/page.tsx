'use client';

import React from 'react';
import Link from 'next/link';
import { useStaffAuth } from '@/providers/StaffAuthProvider';
import { PERMISSIONS, Permission, PERMISSION_LABELS } from '@/lib/constants/permissions';

const MODULE_CARDS: { label: string; href: string; permission: Permission; description: string; color: string }[] = [
    { label: 'Orders',    href: '/staff/orders',    permission: PERMISSIONS.ORDERS_VIEW,    description: 'View and manage lab test orders',    color: 'blue' },
    { label: 'Medicines', href: '/staff/medicines', permission: PERMISSIONS.MEDICINES_VIEW, description: 'View and manage medicine orders',     color: 'green' },
    { label: 'Products',  href: '/staff/products',  permission: PERMISSIONS.PRODUCTS_VIEW,  description: 'Browse tests, packages and offers',  color: 'purple' },
    { label: 'Users',     href: '/staff/users',     permission: PERMISSIONS.USERS_VIEW,     description: 'View patient accounts',              color: 'orange' },
    { label: 'Doctors',   href: '/staff/doctors',   permission: PERMISSIONS.DOCTORS_VIEW,   description: 'Browse doctor profiles',             color: 'teal' },
];

const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green:  'bg-green-50 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    teal:   'bg-teal-50 border-teal-200 hover:bg-teal-100',
};

export default function StaffDashboard() {
    const { staff, hasPermission } = useStaffAuth();

    const accessibleModules = MODULE_CARDS.filter(m => hasPermission(m.permission));

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {staff?.name}</h1>
                <p className="text-gray-500 mt-1">You have access to {accessibleModules.length} module{accessibleModules.length !== 1 ? 's' : ''}.</p>
            </div>

            {accessibleModules.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="font-medium">No modules assigned</p>
                    <p className="text-sm mt-1">Contact your admin to get access to modules.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accessibleModules.map(module => (
                        <Link
                            key={module.href}
                            href={module.href}
                            className={`block border rounded-xl p-5 transition-colors ${colorMap[module.color]}`}
                        >
                            <h3 className="font-semibold text-gray-800 text-base mb-1">{module.label}</h3>
                            <p className="text-sm text-gray-500">{module.description}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
