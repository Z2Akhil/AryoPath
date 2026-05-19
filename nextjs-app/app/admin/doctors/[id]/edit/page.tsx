'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import DoctorForm from '@/components/admin/doctors/DoctorForm';
import adminDoctorApi from '@/lib/api/adminDoctorApi';
import { Doctor, DoctorFormValues, ConsultationMode } from '@/types/doctor';

export default function EditDoctorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await adminDoctorApi.getById(id);
        setDoctor(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load doctor');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-800">{error || 'Doctor not found'}</p>
            <button
              onClick={() => router.push('/admin/doctors')}
              className="text-sm text-red-600 underline mt-1"
            >
              Back to doctors list
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { _id, profilePhoto, createdBy, updatedBy, createdAt, updatedAt, isDeleted, ...rawFields } = doctor;

  const VALID_MODES: ConsultationMode[] = ['video', 'audio'];
  const formFields: Partial<DoctorFormValues> = {
    ...rawFields,
    consultationModes: (rawFields.consultationModes ?? []).filter(
      (m): m is ConsultationMode => VALID_MODES.includes(m as ConsultationMode)
    ),
    availableTimeSlots: rawFields.availableTimeSlots ?? [],
    availableDays: rawFields.availableDays ?? [],
    languages: rawFields.languages ?? [],
    qualifications: rawFields.qualifications ?? [],
    conditionsTreated: rawFields.conditionsTreated ?? [],
    symptomsTreated: rawFields.symptomsTreated ?? [],
    treatmentsOffered: rawFields.treatmentsOffered ?? [],
    faqs: rawFields.faqs ?? [],
    gender: (rawFields.gender ?? '') as DoctorFormValues['gender'],
    shortBio: rawFields.shortBio ?? '',
    about: rawFields.about ?? '',
    mobile: rawFields.mobile ?? '',
    whatsapp: rawFields.whatsapp ?? '',
    email: rawFields.email ?? '',
    registrationNumber: rawFields.registrationNumber ?? '',
    medicalCouncil: rawFields.medicalCouncil ?? '',
    aboutConsultation: rawFields.aboutConsultation ?? '',
    metaTitle: rawFields.metaTitle ?? '',
    metaDescription: rawFields.metaDescription ?? '',
    seoKeywords: rawFields.seoKeywords ?? '',
  };

  return (
    <DoctorForm
      doctorId={id}
      initialData={formFields}
      initialPhoto={profilePhoto ?? null}
    />
  );
}
