'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  User, Award, Calendar, FileText, HelpCircle,
  Save, CheckCircle2, Loader2, Stethoscope, ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { doctorSchema, DoctorFormValues, DOCTOR_FORM_DEFAULTS, DoctorImage } from '@/types/doctor';
import adminDoctorApi from '@/lib/api/adminDoctorApi';
import BasicInfoTab from './tabs/BasicInfoTab';
import ProfessionalTab from './tabs/ProfessionalTab';
import ConsultationTab from './tabs/ConsultationTab';
import ContentTab from './tabs/ContentTab';
import FaqSeoTab from './tabs/FaqSeoTab';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic',        label: 'Basic Info',        Icon: User },
  { id: 'professional', label: 'Professional',       Icon: Award },
  { id: 'consultation', label: 'Consultation',       Icon: Calendar },
  { id: 'content',      label: 'Content',            Icon: FileText },
  { id: 'faq-seo',      label: 'FAQ & SEO',          Icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TAB_FIELDS: Record<TabId, string[]> = {
  basic:        ['name', 'slug'],
  professional: ['specialization'],
  consultation: ['consultationFee', 'followUpFee', 'consultationModes', 'consultationDuration', 'maxPatientsPerDay'],
  content:      ['conditionsTreated', 'symptomsTreated', 'treatmentsOffered', 'aboutConsultation'],
  'faq-seo':    ['faqs'],
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  doctorId?: string;
  initialData?: Partial<DoctorFormValues>;
  initialPhoto?: DoctorImage | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorForm({ doctorId, initialData, initialPhoto }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [profilePhoto, setProfilePhoto] = useState<DoctorImage | null>(initialPhoto ?? null);
  const [isSaving, setIsSaving]       = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const methods = useForm<DoctorFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(doctorSchema) as any,
    defaultValues: { ...DOCTOR_FORM_DEFAULTS, ...initialData },
  });

  const { handleSubmit, getValues, watch, setValue, formState: { errors } } = methods;

  // Auto-generate slug from name (until user manually edits it)
  const slugTouched = useRef(!!initialData?.slug);
  const name = watch('name');
  useEffect(() => {
    if (slugTouched.current) return;
    if (name) {
      setValue(
        'slug',
        name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'),
        { shouldDirty: true }
      );
    }
  }, [name, setValue]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const tabHasError = (tabId: TabId) =>
    TAB_FIELDS[tabId].some((f) => f in errors);

  const buildPayload = (values: DoctorFormValues, publish: boolean) => ({
    ...values,
    profilePhoto,
    isPublished: publish,
    isDraft: !publish,
  });

  // ── Save Draft (no validation) ───────────────────────────────────────────────

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const payload = buildPayload(getValues() as DoctorFormValues, false);
      if (doctorId) await adminDoctorApi.update(doctorId, payload);
      else          await adminDoctorApi.create(payload);
      toast.success('Draft saved successfully!');
      router.push('/admin/doctors');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Publish (with validation) ─────────────────────────────────────────────────

  const publish = handleSubmit(
    async (values) => {
      setIsPublishing(true);
      try {
        const payload = buildPayload(values, true);
        if (doctorId) await adminDoctorApi.update(doctorId, payload);
        else          await adminDoctorApi.create(payload);
        toast.success(doctorId ? 'Doctor updated & published!' : 'Doctor published!');
        router.push('/admin/doctors');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to publish doctor');
      } finally {
        setIsPublishing(false);
      }
    },
    (formErrors) => {
      const errFields = Object.keys(formErrors);
      const errTab = TABS.find((t) => TAB_FIELDS[t.id].some((f) => errFields.includes(f)));
      if (errTab) setActiveTab(errTab.id);
      toast.error('Please fix the highlighted errors before publishing.');
    }
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <FormProvider {...methods}>
      <div className="max-w-5xl mx-auto pb-24 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push('/admin/doctors')}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Doctors
            </button>
            <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-100 mb-1.5">
              <Stethoscope className="h-3 w-3" /> Doctor Management
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {doctorId ? 'Edit Doctor Profile' : 'Add New Doctor'}
            </h1>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 text-sm shadow-lg shadow-teal-200"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {doctorId ? 'Update & Publish' : 'Publish Doctor'}
            </button>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-0.5 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            const hasErr = tabHasError(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center ${
                  active
                    ? 'bg-white text-teal-700 shadow-sm'
                    : hasErr
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                {hasErr && (
                  <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div>
          {activeTab === 'basic'        && <BasicInfoTab profilePhoto={profilePhoto} onPhotoChange={setProfilePhoto} />}
          {activeTab === 'professional' && <ProfessionalTab />}
          {activeTab === 'consultation' && <ConsultationTab />}
          {activeTab === 'content'      && <ContentTab />}
          {activeTab === 'faq-seo'      && <FaqSeoTab />}
        </div>

        {/* ── Sticky bottom action bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-lg px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400 hidden sm:block">
              {doctorId ? 'Editing existing doctor profile' : 'All fields marked * are required to publish'}
            </p>
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={saveDraft}
                disabled={isSaving || isPublishing}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 text-sm transition-all"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={isSaving || isPublishing}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 text-sm transition-all shadow-lg shadow-teal-200"
              >
                {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {doctorId ? 'Update & Publish' : 'Publish Doctor'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
