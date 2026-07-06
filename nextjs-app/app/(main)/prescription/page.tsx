'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileText, X, Loader2, CheckCircle2, Phone, Mail, Image as ImageIcon, ShieldCheck,
} from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { useToast } from '@/providers/ToastProvider';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

export default function PrescriptionUploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const { openAuth } = useAuthModal();
  const toast = useToast();

  const [files, setFiles]       = useState<File[]>([]);
  const [mobile, setMobile]     = useState('');
  const [email, setEmail]       = useState('');
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefill contact once the user is known
  React.useEffect(() => {
    if (user) {
      setMobile(prev => prev || user.mobileNumber || '');
      setEmail(prev => prev || user.email || '');
    }
  }, [user]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES) { toast.error(`Maximum ${MAX_FILES} files`); break; }
      if (!ALLOWED.includes(f.type)) { toast.error(`${f.name}: only JPG, PNG, PDF`); continue; }
      if (f.size > MAX_SIZE) { toast.error(`${f.name}: must be under 10MB`); continue; }
      if (next.some(x => x.name === f.name && x.size === f.size)) continue; // dedupe
      next.push(f);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!user) { openAuth(); return; }
    if (files.length === 0) { toast.error('Please add at least one prescription file'); return; }
    if (!/^\d{10}$/.test(mobile.trim())) { toast.error('Enter a valid 10-digit mobile number'); return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Enter a valid email'); return; }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      fd.append('contactMobile', mobile.trim());
      if (email.trim()) fd.append('contactEmail', email.trim());
      if (note.trim())  fd.append('note', note.trim());

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(r => r.json());

      if (res.success) {
        setDone(true);
      } else {
        toast.error(res.message || 'Failed to submit prescription');
      }
    } catch {
      toast.error('Failed to submit prescription');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──
  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-green-500" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Prescription Received</h1>
          <p className="text-sm text-gray-500 mb-6">
            Thank you! Our team will review your prescription and <strong>call you shortly</strong> to confirm your medicines and complete the order.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Upload Prescription</h1>
            <p className="text-sm text-gray-400">We&apos;ll order your medicines for you</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Dropzone */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Prescription Files <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-gray-200 hover:border-rose-300 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600">Tap to upload or drag files here</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF · up to {MAX_FILES} files · max 10MB each</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                multiple
                hidden
                onChange={e => addFiles(e.target.files)}
              />
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => {
                  const isPdf = f.type === 'application/pdf';
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-50' : 'bg-blue-50'}`}>
                        {isPdf ? <FileText className="h-4 w-4 text-red-500" /> : <ImageIcon className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                        <p className="text-[11px] text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  );
                })}
                <p className="text-[11px] text-gray-400">{files.length}/{MAX_FILES} files added</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">We&apos;ll call this number to confirm your order.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Email <span className="text-gray-300 normal-case font-medium">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="For order & payment updates"
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Note <span className="text-gray-300 normal-case font-medium">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 500))}
                rows={2}
                placeholder="Anything we should know?"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold rounded-2xl transition-colors shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {submitting ? 'Submitting…' : 'Submit Prescription'}
          </button>

          {!user && (
            <p className="text-center text-xs text-gray-400">You&apos;ll be asked to log in before submitting.</p>
          )}
        </div>

        {/* Trust note */}
        <div className="mt-4 flex items-start gap-2 px-2">
          <ShieldCheck className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            Your prescription is private and used only to process your medicine order. Our pharmacist verifies every order.
          </p>
        </div>
      </div>
    </div>
  );
}
