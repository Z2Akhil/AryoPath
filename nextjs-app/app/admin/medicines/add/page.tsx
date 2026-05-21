'use client';

export const dynamic = 'force-dynamic';

import MedicineForm from '@/components/admin/medicines/MedicineForm';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { PERMISSIONS } from '@/lib/constants/permissions';

export default function AddMedicinePage() {
  return (
    <PermissionGuard permission={PERMISSIONS.MEDICINES_EDIT} section="Medicines">
      <MedicineForm />
    </PermissionGuard>
  );
}
