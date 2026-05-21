'use client';

import React from 'react';
import { useStaffAuth } from '@/providers/StaffAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function StaffUsersPage() {
    const { hasPermission } = useStaffAuth();

    if (!hasPermission(PERMISSIONS.USERS_VIEW)) {
        return (
            <div className="p-6 text-center text-gray-500 mt-16">
                <p className="text-lg font-medium">Access Denied</p>
                <p className="text-sm mt-1">You don&apos;t have permission to view users.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-6">Users</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <p className="text-sm">Patient accounts list will appear here.</p>
            </div>
        </div>
    );
}
