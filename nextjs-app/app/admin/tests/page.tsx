'use client';

export const dynamic = 'force-dynamic';

import ProductCatalog from '@/components/admin/ProductCatalog';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Microscope } from 'lucide-react';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function TestsPage() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS_VIEW} section="Products">
            <ProductCatalog
                type="TEST"
                title="Tests"
                icon={<Microscope className="w-6 h-6" />}
            />
        </PermissionGuard>
    );
}
