'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ShieldCheck, Star, Activity } from 'lucide-react';
import { DoctorFormValues } from '@/types/doctor';
import DoctorFaqInput from '../DoctorFaqInput';

const field =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
}

function ToggleRow({ icon, label, description, checked, onChange, activeColor = 'bg-teal-500' }: ToggleRowProps) {
  return (
    <div className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all ${checked ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${checked ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? activeColor : 'bg-gray-200'}`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}

export default function FaqSeoTab() {
  const { register, watch, setValue } = useFormContext<DoctorFormValues>();

  const metaDescription = watch('metaDescription') ?? '';
  const isVerified = watch('isVerified');
  const isFeatured = watch('isFeatured');
  const isActive = watch('isActive');

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Doctor Status
        </p>
        <div className="space-y-3">
          <ToggleRow
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Verified Doctor"
            description="Shows a verified badge on the doctor's profile"
            checked={isVerified}
            onChange={(v) => setValue('isVerified', v, { shouldDirty: true })}
          />
          <ToggleRow
            icon={<Star className="h-5 w-5" />}
            label="Featured Doctor"
            description="Highlighted on the homepage and search results"
            checked={isFeatured}
            onChange={(v) => setValue('isFeatured', v, { shouldDirty: true })}
            activeColor="bg-amber-500"
          />
          <ToggleRow
            icon={<Activity className="h-5 w-5" />}
            label="Active Profile"
            description="Doctor is accepting new patient bookings"
            checked={isActive}
            onChange={(v) => setValue('isActive', v, { shouldDirty: true })}
            activeColor="bg-green-500"
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <DoctorFaqInput />
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          SEO Settings
        </p>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Meta Title
            </label>
            <input
              {...register('metaTitle')}
              placeholder="e.g. Book Dr. Priya Sharma – Cardiologist Online | Ayropath"
              className={field}
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              <span>Meta Description</span>
              <span className={`font-mono ${metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                {metaDescription.length}/160
              </span>
            </label>
            <textarea
              {...register('metaDescription')}
              rows={3}
              placeholder="Consult Dr. Priya Sharma, an experienced Cardiologist with 12+ years of expertise..."
              className={`${field} resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              SEO Keywords
            </label>
            <input
              {...register('seoKeywords')}
              placeholder="cardiologist online, heart specialist consultation, book cardiologist india"
              className={field}
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated keywords</p>
          </div>
        </div>
      </div>
    </div>
  );
}
