'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import type { UploadedPrescription } from '@/types/medicineOrder';

export type { UploadedPrescription };

interface Props {
  value: UploadedPrescription[];
  onChange: (prescriptions: UploadedPrescription[]) => void;
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_MB = 10;

export default function PrescriptionUpload({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are accepted');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const result = await medicineOrderApi.uploadPrescription(file);
      if (result.success) {
        onChange([...value, { url: result.data.url, publicId: result.data.publicId, fileName: file.name, fileType: file.type }]);
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [value]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const remove = (publicId: string) => {
    onChange(value.filter(p => p.publicId !== publicId));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          dragging
            ? 'border-teal-400 bg-teal-50'
            : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50 bg-white'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
            <Upload className="h-6 w-6 text-teal-500" />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-gray-700">
            {uploading ? 'Uploading...' : 'Drop prescription here or click to browse'}
          </p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF up to 10MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-xs font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Uploaded files */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((p) => (
            <div
              key={p.publicId}
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-green-200 flex items-center justify-center flex-shrink-0">
                {p.fileType === 'application/pdf'
                  ? <FileText className="h-4 w-4 text-red-500" />
                  : <ImageIcon className="h-4 w-4 text-blue-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.fileName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-600 font-bold">Uploaded</span>
                </div>
              </div>
              {p.fileType !== 'application/pdf' && (
                <a href={p.url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                  <img src={p.url} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-green-200" />
                </a>
              )}
              <button
                onClick={() => remove(p.publicId)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
