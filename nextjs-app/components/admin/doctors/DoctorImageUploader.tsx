'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, X, User } from 'lucide-react';
import { DoctorImage } from '@/types/doctor';

interface Props {
  photo: DoctorImage | null;
  name?: string;
  onChange: (photo: DoctorImage | null) => void;
}

export default function DoctorImageUploader({ photo, name, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getApiKey = (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('admin_auth');
      if (stored) return JSON.parse(stored)?.apiKey ?? '';
    } catch {}
    return '';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'ayropath/doctors');

      const apiKey = getApiKey();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: apiKey ? { 'x-api-key': apiKey } : {},
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');

      onChange(data.data as DoctorImage);
    } catch (err: any) {
      alert(err.message || 'Photo upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
          {photo ? (
            <img src={photo.url} alt="Doctor" className="w-full h-full object-cover" />
          ) : initials ? (
            <span className="text-3xl font-extrabold text-teal-600">{initials}</span>
          ) : (
            <User className="h-12 w-12 text-teal-400" />
          )}

          {/* Hover overlay */}
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </button>
        </div>

        {/* Remove button */}
        {photo && !uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
        ) : (
          <><Camera className="h-4 w-4" /> {photo ? 'Change Photo' : 'Upload Photo'}</>
        )}
      </button>
      <p className="text-xs text-gray-400">JPG, PNG, WebP · max 5MB</p>
    </div>
  );
}
