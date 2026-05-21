'use client';

import React from 'react';
import { useStaffAuth } from '@/providers/StaffAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function StaffMedicinesPage() {
    const { hasPermission } = useStaffAuth();

    if (!hasPermission(PERMISSIONS.MEDICINES_VIEW)) {
        return (
            <div className="p-6 text-center text-gray-500 mt-16">
                <p className="text-lg font-medium">Access Denied</p>
                <p className="text-sm mt-1">You don&apos;t have permission to view medicines.</p>
            </div>
        );
    }

    const canEdit = hasPermission(PERMISSIONS.MEDICINES_EDIT);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Medicine Orders</h1>
                {canEdit && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Edit access</span>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                <p className="text-sm">Medicine orders list will appear here.</p>
            </div>
        </div>
    );
}
