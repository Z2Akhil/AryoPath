'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, UserCog, ClipboardList } from 'lucide-react';
import DoctorForm from '@/components/admin/doctors/DoctorForm';
import CredentialsCard from '@/components/admin/doctors/CredentialsCard';
import adminDoctorApi from '@/lib/api/adminDoctorApi';
import { Doctor, DoctorFormValues, ConsultationMode } from '@/types/doctor';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';

type Tab = 'profile' | 'access';

export default function EditDoctorPage() {
  const { isAdmin } = useAdminAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

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

  if (!isAdmin) return <AccessDenied section="Doctor Management" />;

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

  const hasLogin = (doctor as any).hasLogin ?? false;
  const loginUsername = (doctor as any).loginUsername ?? '';

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile',       Icon: ClipboardList },
    { id: 'access',  label: 'Portal Access', Icon: UserCog },
  ];

  return (
    <div className="space-y-4">
      {/* Page-level tab bar */}
      <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl w-fit">
        {tabs.map(({ id: tabId, label, Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tabId
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {tabId === 'access' && hasLogin && (
              <span className="w-2 h-2 rounded-full bg-green-400" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <DoctorForm
          doctorId={id}
          initialData={formFields}
          initialPhoto={profilePhoto ?? null}
        />
      )}

      {activeTab === 'access' && (
        <CredentialsCard doctorId={id} hasLogin={hasLogin} loginUsername={loginUsername} />
      )}
    </div>
  );
}
