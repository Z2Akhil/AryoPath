'use client';

export const dynamic = 'force-dynamic';

import DoctorForm from '@/components/admin/doctors/DoctorForm';
import PermissionGuard from '@/components/admin/PermissionGuard';

export default function AddDoctorPage() {
  return (
    <PermissionGuard permission={null} section="Doctor Management">
      <DoctorForm />
    </PermissionGuard>
  );
}
