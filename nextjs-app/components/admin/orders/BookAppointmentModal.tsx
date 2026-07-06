'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Loader2, Stethoscope, CreditCard, Video, Phone, User as UserIcon, Calendar,
} from 'lucide-react';
import { adminAxios } from '@/lib/api/adminAxios';
import type { CustomerUser } from '@/types/admin';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FALLBACK_SLOTS = [
  '09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM',
];

interface Doctor {
  _id: string; name: string; slug: string; consultationFee: number;
  availableDays?: string[]; availableTimeSlots?: string[]; consultationModes?: string[];
  specialization?: string;
}

interface Props {
  user: CustomerUser;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const field = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500';

export default function BookAppointmentModal({ user, onClose, onSuccess }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [doctorSlug, setDoctorSlug] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [mode, setMode] = useState<'video' | 'audio'>('video');

  const [pName, setPName] = useState(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim());
  const [pAge, setPAge]   = useState('');
  const [pGender, setPGender] = useState<'male' | 'female' | 'other'>('male');
  const [pMobile, setPMobile] = useState(user.mobileNumber ?? '');
  const [pEmail, setPEmail]   = useState(user.email ?? '');
  const [symptoms, setSymptoms] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [linkResult, setLinkResult] = useState<{ url: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    adminAxios.get('/doctors')
      .then(r => setDoctors(r.data?.data ?? []))
      .catch(() => setError('Failed to load doctors'))
      .finally(() => setLoadingDoctors(false));
  }, []);

  const doctor = doctors.find(d => d.slug === doctorSlug);
  const fee = doctor?.consultationFee ?? 0;

  // Next 14 days filtered by the doctor's available days
  const dates = useMemo(() => {
    if (!doctor) return [];
    const avDays = doctor.availableDays ?? [];
    const out: { fullDate: string; label: string; dayAbbr: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const dayAbbr = DAY_ABBR[d.getDay()];
      if (avDays.length && !avDays.includes(dayAbbr)) continue;
      const fullDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      out.push({ fullDate, dayAbbr, label: `${dayAbbr} ${d.getDate()} ${MONTHS[d.getMonth()]}` });
    }
    return out;
  }, [doctor]);

  const allSlots = (doctor?.availableTimeSlots && doctor.availableTimeSlots.length) ? doctor.availableTimeSlots : FALLBACK_SLOTS;

  // Fetch booked slots for the chosen doctor + date
  useEffect(() => {
    if (!doctorSlug || !date) { setBookedSlots([]); return; }
    fetch(`/api/consult/booked-slots?doctorSlug=${encodeURIComponent(doctorSlug)}&date=${encodeURIComponent(date)}`)
      .then(r => r.json()).then(j => setBookedSlots(j.bookedSlots ?? [])).catch(() => setBookedSlots([]));
  }, [doctorSlug, date]);

  // Reset dependent fields when doctor/date change
  useEffect(() => { setDate(''); setSlot(''); }, [doctorSlug]);
  useEffect(() => { setSlot(''); }, [date]);

  const canSubmit = doctorSlug && date && slot && pName.trim() && /^\d{10}$/.test(pMobile.trim()) &&
    parseInt(pAge) > 0 && parseInt(pAge) <= 120;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const submit = async () => {
    setError('');
    if (!canSubmit) { setError('Complete doctor, slot, and patient details (valid mobile & age).'); return; }
    setSubmitting(true);
    try {
      const res = await adminAxios.post('/admin/appointments/book-on-behalf', {
        userId: user._id, doctorSlug,
        patientName: pName.trim(), patientAge: parseInt(pAge), patientGender: pGender,
        patientMobile: pMobile.trim(), patientEmail: pEmail.trim(),
        consultationMode: mode, appointmentDate: date, appointmentTime: slot, symptoms: symptoms.trim(),
      });
      if (res.data?.success) {
        if (res.data.paymentLink) setLinkResult({ url: res.data.paymentLink, id: res.data.appointment._id });
        else onSuccess(`Appointment booked for ${pName}`); // free consult (no fee)
      } else setError(res.data?.error || 'Failed to book appointment');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to book appointment');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center"><Stethoscope className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Book Appointment — on behalf</h2>
              <p className="text-xs text-gray-400">{user.firstName} {user.lastName} · {user.mobileNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Doctor */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Doctor</label>
            {loadingDoctors ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading doctors…</div>
            ) : (
              <select value={doctorSlug} onChange={e => setDoctorSlug(e.target.value)} className={field}>
                <option value="">Select a doctor…</option>
                {doctors.map(d => (
                  <option key={d.slug} value={d.slug}>{d.name}{d.specialization ? ` · ${d.specialization}` : ''} — {fmt(d.consultationFee || 0)}</option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          {doctor && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Date</label>
              {dates.length === 0 ? (
                <p className="text-xs text-gray-400">No available days for this doctor in the next 14 days.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dates.map(d => (
                    <button key={d.fullDate} onClick={() => setDate(d.fullDate)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${date === d.fullDate ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Slot */}
          {doctor && date && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Time Slot</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allSlots.map(s => {
                  const taken = bookedSlots.includes(s);
                  return (
                    <button key={s} disabled={taken} onClick={() => setSlot(s)}
                      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        taken ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                        : slot === s ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode */}
          {doctor && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Consultation Mode</label>
              <div className="flex gap-2">
                {(['video', 'audio'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${mode === m ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                    {m === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />} {m === 'video' ? 'Video' : 'Audio'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Patient */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Patient Details</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Patient name *" className={field} />
              <input value={pMobile} onChange={e => setPMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Mobile * (10 digits)" className={field} />
              <input type="number" value={pAge} onChange={e => setPAge(e.target.value)} placeholder="Age *" min={1} max={120} className={field} />
              <select value={pGender} onChange={e => setPGender(e.target.value as any)} className={field}>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
              <input value={pEmail} onChange={e => setPEmail(e.target.value)} placeholder="Email (optional)" className={`${field} sm:col-span-2`} />
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={2} placeholder="Symptoms / reason (optional)" className={`${field} sm:col-span-2 resize-none`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {doctor && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Consultation Fee</span>
              <span className="font-extrabold text-gray-900">{fmt(fee)}</span>
            </div>
          )}
          {fee > 0 && <p className="text-[11px] text-gray-400">A Cashfree payment link (48h) will be sent to the patient via SMS{pEmail.trim() ? ' & email' : ''}. Slot is held until paid; the appointment confirms automatically on payment.</p>}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button onClick={submit} disabled={submitting || !canSubmit}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold rounded-2xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
            {submitting ? 'Creating…' : fee > 0 ? `Send Payment Link · ${fmt(fee)}` : 'Book Appointment'}
          </button>
        </div>
      </div>

      {/* Link result */}
      {linkResult && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3"><CreditCard className="h-7 w-7 text-green-500" /></div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">Appointment Held · Link Sent</h3>
            <p className="text-xs text-gray-500 mb-4">The slot is held. Cashfree sent the payment link to the patient via SMS{pEmail.trim() ? ' & email' : ''}. It confirms automatically once paid (else the slot releases in 48h).</p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4">
              <input readOnly value={linkResult.url} className="flex-1 bg-transparent text-xs text-gray-600 outline-none truncate" />
              <button onClick={() => { navigator.clipboard?.writeText(linkResult.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 whitespace-nowrap px-2">{copied ? 'Copied' : 'Copy'}</button>
            </div>
            <button onClick={() => onSuccess('Appointment held · payment link sent')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
