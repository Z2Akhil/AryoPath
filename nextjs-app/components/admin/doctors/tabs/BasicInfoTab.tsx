'use client';

import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { RefreshCw, Phone, MessageCircle, Mail } from 'lucide-react';
import { DoctorFormValues, DoctorImage } from '@/types/doctor';
import DoctorImageUploader from '../DoctorImageUploader';
import DynamicListInput from '@/components/admin/medicines/DynamicListInput';

interface Props {
  profilePhoto: DoctorImage | null;
  onPhotoChange: (photo: DoctorImage | null) => void;
}

const field =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all';

export default function BasicInfoTab({ profilePhoto, onPhotoChange }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<DoctorFormValues>();

  const name = watch('name');
  const slug = watch('slug');
  const slugTouched = useRef(false);

  useEffect(() => {
    if (slugTouched.current) return;
    if (name) {
      setValue(
        'slug',
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-'),
        { shouldDirty: true }
      );
    }
  }, [name, setValue]);

  const regenerateSlug = () => {
    slugTouched.current = false;
    setValue(
      'slug',
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-'),
      { shouldDirty: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Photo + Name row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Identity
        </p>
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Photo */}
          <div className="flex-shrink-0">
            <DoctorImageUploader
              photo={profilePhoto}
              name={name}
              onChange={onPhotoChange}
            />
          </div>

          {/* Name + Slug + Gender */}
          <div className="flex-1 space-y-5 w-full">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="Dr. Priya Sharma"
                className={field}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  {...register('slug')}
                  onFocus={() => { slugTouched.current = true; }}
                  placeholder="dr-priya-sharma"
                  className={`${field} flex-1`}
                />
                <button
                  type="button"
                  onClick={regenerateSlug}
                  title="Regenerate from name"
                  className="px-3 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-teal-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {errors.slug && (
                <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Gender
              </label>
              <select {...register('gender')} className={field}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Contact Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Mobile No.
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('mobile')}
                type="tel"
                placeholder="+91 98765 43210"
                className={`${field} pl-10`}
              />
            </div>
            {errors.mobile && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              WhatsApp No.
            </label>
            <div className="relative">
              <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('whatsapp')}
                type="tel"
                placeholder="+91 98765 43210"
                className={`${field} pl-10`}
              />
            </div>
            {errors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{errors.whatsapp.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                placeholder="doctor@example.com"
                className={`${field} pl-10`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          About
        </p>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Short Bio
            </label>
            <input
              {...register('shortBio')}
              placeholder="One-liner shown on listing cards, e.g. 'MBBS, MD · 12 years in Cardiology'"
              className={field}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              About Doctor
            </label>
            <textarea
              {...register('about')}
              rows={5}
              placeholder="Detailed description of the doctor's background, expertise, and approach..."
              className={`${field} resize-none`}
            />
          </div>

          <DynamicListInput
            name="languages"
            label="Languages Spoken"
            placeholder="e.g. Hindi, English, Tamil..."
            itemColor="green"
          />
        </div>
      </div>
    </div>
  );
}
