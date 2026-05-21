'use client';

export const dynamic = 'force-dynamic';

import ProductCatalog from '@/components/admin/ProductCatalog';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { Tag } from 'lucide-react';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function OffersPage() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS_VIEW} section="Products">
            <ProductCatalog
                type="OFFER"
                title="Offers"
                icon={<Tag className="w-6 h-6" />}
            />
        </PermissionGuard>
    );
}
