'use client';

import React from 'react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from './AccessDenied';
import { Permission } from '@/lib/constants/permissions';

interface Props {
    permission: Permission | null;
    section?: string;
    children: React.ReactNode;
}

export default function PermissionGuard({ permission, section, children }: Props) {
    const { isAdmin, hasPermission } = useAdminAuth();

    const allowed = isAdmin || (permission !== null && hasPermission(permission!));
    if (!allowed) {
        return <AccessDenied section={section} />;
    }

    return <>{children}</>;
}
