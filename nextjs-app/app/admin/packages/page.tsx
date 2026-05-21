'use client';

export const dynamic = 'force-dynamic';

import ProductCatalog from '@/components/admin/ProductCatalog';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Package } from 'lucide-react';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function PackagesPage() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS_VIEW} section="Products">
            <ProductCatalog
                type="PROFILE"
                title="Packages"
                icon={<Package className="w-6 h-6" />}
            />
        </PermissionGuard>
    );
}
