'use client';

import React from 'react';
import Link from 'next/link';
import {
    ShoppingCart, Package, Users, Bell, Stethoscope, Pill,
} from 'lucide-react';
import { Permission, PERMISSIONS } from '@/lib/constants/permissions';
import { StaffProfile } from '@/types/staff';

interface ModuleCard {
    label: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    permission: Permission;
}

const MODULE_CARDS: ModuleCard[] = [
    {
        label: 'Orders',
        description: 'View and manage lab test orders',
        href: '/admin/orders',
        icon: <ShoppingCart className="w-6 h-6" />,
        permission: PERMISSIONS.ORDERS_VIEW,
    },
    {
        label: 'Medicines',
        description: 'Browse and edit medicine listings',
        href: '/admin/medicines',
        icon: <Pill className="w-6 h-6" />,
        permission: PERMISSIONS.MEDICINES_VIEW,
    },
    {
        label: 'Products',
        description: 'Manage tests, packages and offers',
        href: '/admin/offers',
        icon: <Package className="w-6 h-6" />,
        permission: PERMISSIONS.PRODUCTS_VIEW,
    },
    {
        label: 'Doctors',
        description: 'View doctor profiles',
        href: '/admin/doctors',
        icon: <Stethoscope className="w-6 h-6" />,
        permission: PERMISSIONS.DOCTORS_VIEW,
    },
    {
        label: 'Users',
        description: 'Search and view patient accounts',
        href: '/admin/users',
        icon: <Users className="w-6 h-6" />,
        permission: PERMISSIONS.USERS_VIEW,
    },

    {
        label: 'Notifications',
        description: 'Send and manage notifications',
        href: '/admin/notifications',
        icon: <Bell className="w-6 h-6" />,
        permission: PERMISSIONS.NOTIFICATIONS_VIEW,
    },
];

interface Props {
    permissions: Permission[];
    user: StaffProfile | null;
}

export default function StaffDashboard({ permissions, user }: Props) {
    const accessible = MODULE_CARDS.filter(m => permissions.includes(m.permission));

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h1 className="text-xl font-bold text-gray-900">
                    Welcome back, {user?.name?.split(' ')[0] || 'Staff'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    You have access to {accessible.length} section{accessible.length !== 1 ? 's' : ''} of the admin panel.
                </p>
            </div>

            {accessible.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                    <p className="text-sm">No sections have been assigned to your account yet.</p>
                    <p className="text-xs mt-1">Contact your administrator to get access.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accessible.map(card => (
                        <Link
                            key={card.permission}
                            href={card.href}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    {card.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{card.label}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{card.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
