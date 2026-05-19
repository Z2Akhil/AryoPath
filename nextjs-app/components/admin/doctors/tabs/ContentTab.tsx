'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DoctorFormValues } from '@/types/doctor';
import DynamicListInput from '@/components/admin/medicines/DynamicListInput';

const field =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none';

export default function ContentTab() {
  const { register } = useFormContext<DoctorFormValues>();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Clinical Expertise
        </p>
        <div className="space-y-7">
          <DynamicListInput
            name="conditionsTreated"
            label="Conditions Treated"
            placeholder="e.g. Hypertension, Diabetes, Anxiety..."
            itemColor="blue"
          />
          <DynamicListInput
            name="symptomsTreated"
            label="Symptoms Treated"
            placeholder="e.g. Chest pain, Fatigue, Breathlessness..."
            itemColor="amber"
          />
          <DynamicListInput
            name="treatmentsOffered"
            label="Treatments Offered"
            placeholder="e.g. Lifestyle counselling, Medication management..."
            itemColor="green"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Consultation Process
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            About Consultation
          </label>
          <textarea
            {...register('aboutConsultation')}
            rows={6}
            placeholder="Describe what a patient can expect during a consultation — what you'll discuss, how you'll help, what to bring, etc."
            className={field}
          />
          <p className="text-xs text-gray-400 mt-2">
            This is shown to patients before they book — make it clear and reassuring.
          </p>
        </div>
      </div>
    </div>
  );
}
