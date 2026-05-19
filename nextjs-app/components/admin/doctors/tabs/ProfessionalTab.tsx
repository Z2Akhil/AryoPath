'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Award, Plus } from 'lucide-react';
import { DoctorFormValues, SPECIALIZATIONS, COMMON_QUALIFICATIONS } from '@/types/doctor';
import DynamicListInput from '@/components/admin/medicines/DynamicListInput';

const field =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all';

export default function ProfessionalTab() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<DoctorFormValues>();

  const qualifications: string[] = watch('qualifications') ?? [];

  const quickAddQual = (q: string) => {
    if (!qualifications.includes(q)) {
      setValue('qualifications', [...qualifications, q], { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Specialization + Experience */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Specialization & Experience
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Specialization <span className="text-red-500">*</span>
            </label>
            <select {...register('specialization')} className={field}>
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.specialization && (
              <p className="text-xs text-red-500 mt-1">{errors.specialization.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Years of Experience
            </label>
            <div className="relative">
              <input
                {...register('experience')}
                type="number"
                min={0}
                max={60}
                placeholder="0"
                className={`${field} pr-16`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                years
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 bg-teal-50 rounded-xl flex items-center justify-center">
            <Award className="h-5 w-5 text-teal-600" />
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Qualifications
          </p>
        </div>

        {/* Quick-add chips */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">Quick add:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_QUALIFICATIONS.filter((q) => !qualifications.includes(q)).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => quickAddQual(q)}
                className="flex items-center gap-1 px-3 py-1 border border-teal-200 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {q}
              </button>
            ))}
          </div>
        </div>

        <DynamicListInput
          name="qualifications"
          label="All Qualifications"
          placeholder="Type a degree and press Enter..."
          itemColor="blue"
        />
      </div>

      {/* Registration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Registration Details
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Medical Registration Number
            </label>
            <input
              {...register('registrationNumber')}
              placeholder="e.g. MH-12345"
              className={field}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Medical Council
            </label>
            <input
              {...register('medicalCouncil')}
              placeholder="e.g. Maharashtra Medical Council"
              className={field}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
