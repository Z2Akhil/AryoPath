'use client';

import React from 'react';
import { ShieldOff } from 'lucide-react';

interface Props {
    section?: string;
}

export default function AccessDenied({ section }: Props) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="p-4 bg-red-50 rounded-full mb-4">
                <ShieldOff className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
                {section
                    ? `You don't have permission to access ${section}.`
                    : "You don't have permission to view this section."}
                {' '}Contact your administrator to request access.
            </p>
        </div>
    );
}
