'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import MedicineForm from '@/components/admin/medicines/MedicineForm';
import adminMedicineApi from '@/lib/api/adminMedicineApi';
import { Medicine, MedicineFormValues } from '@/types/medicine';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

export default function EditMedicinePage() {
  const { isAdmin, hasPermission } = useAdminAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await adminMedicineApi.getById(id);
        setMedicine(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load medicine');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!isAdmin && !hasPermission(PERMISSIONS.MEDICINES_EDIT)) return <AccessDenied section="Medicines" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-800">{error || 'Medicine not found'}</p>
            <button
              onClick={() => router.push('/admin/medicines')}
              className="text-sm text-red-600 underline mt-1"
            >
              Back to medicines list
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strip _id and audit fields — pass only form-compatible fields
  const {
    _id, images, thumbnail, discountPercentage, createdBy, updatedBy, createdAt, updatedAt,
    ...formFields
  } = medicine;

  return (
    <MedicineForm
      medicineId={id}
      initialData={formFields as Partial<MedicineFormValues>}
      initialImages={images ?? []}
      initialThumbnail={thumbnail ?? null}
    />
  );
}
