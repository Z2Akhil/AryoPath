'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BadgeCheck,
  ChevronRight,
  Video,
  Phone,
  Tag,
  CheckCircle,
  Upload,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { Doctor } from '@/types/doctor';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  patientName: z.string().min(2, 'Name is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  age: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: 'Age required' }).min(1, 'Age required').max(120, 'Invalid age')
  ),
  gender: z.enum(['male', 'female', 'other']),
  symptoms: z.string().optional(),
});

type FormValues = {
  patientName: string;
  mobile: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms?: string;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

interface DatePill {
  dayAbbr: string;
  date: number;
  month: string;
  fullDate: string;
  isToday: boolean;
}

function getNext7Days(): DatePill[] {
  const result: DatePill[] = [];
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push({
      dayAbbr: days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      fullDate: `${yyyy}-${mm}-${dd}`,
      isToday: i === 0,
    });
  }
  return result;
}

// ─── Time slot helpers ────────────────────────────────────────────────────────

const DEFAULT_SLOTS: Record<string, string[]> = {
  Morning: ['07:00 AM','07:30 AM','08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM'],
  Afternoon: ['12:00 PM','12:30 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM'],
  Evening: ['05:00 PM','05:30 PM','06:00 PM','06:30 PM','07:00 PM','07:30 PM','08:00 PM'],
};

function isSlotDisabled(slots: string[], idx: number): boolean {
  return idx % 5 === 2;
}

function groupSlotsByPeriod(slots: string[]): Record<string, string[]> {
  if (!slots || slots.length === 0) return DEFAULT_SLOTS;

  const groups: Record<string, string[]> = { Morning: [], Afternoon: [], Evening: [] };
  slots.forEach((slot) => {
    const lower = slot.toLowerCase();
    if (lower.includes('pm')) {
      const hour = parseInt(slot.split(':')[0]);
      if (hour < 5 || (hour >= 12 && hour <= 4)) {
        groups.Afternoon.push(slot);
      } else {
        groups.Evening.push(slot);
      }
    } else {
      groups.Morning.push(slot);
    }
  });

  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, photo, size = 'md' }: { name: string; photo?: { url: string } | null; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const dim = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';
  const textSz = size === 'sm' ? 'text-base' : 'text-lg';

  if (photo?.url) {
    return (
      <div className={`relative ${dim} rounded-full overflow-hidden border-2 border-blue-100 shrink-0`}>
        <Image src={photo.url} alt={name} fill className="object-cover" sizes="64px" />
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 border-2 border-blue-100`}>
      <span className={`text-white font-bold ${textSz}`}>{initials}</span>
    </div>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────

interface SuccessData {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationMode: string;
  finalAmount: number;
  _id: string;
}

function SuccessOverlay({ data, onHome }: { data: SuccessData; onHome: () => void }) {
  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Appointment Booked!</h2>
      <p className="text-gray-500 text-sm mb-6">Your consultation has been confirmed.</p>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 w-full max-w-sm p-5 text-left space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Doctor</span>
          <span className="font-bold text-gray-900">Dr. {data.doctorName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date</span>
          <span className="font-bold text-gray-900">{data.appointmentDate}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Time</span>
          <span className="font-bold text-gray-900">{data.appointmentTime}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mode</span>
          <span className="font-bold text-gray-900 capitalize">{data.consultationMode} Call</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Amount Paid</span>
          <span className="font-black text-gray-900">₹{data.finalAmount}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 w-full max-w-sm mb-6">
        <p className="text-xs text-gray-500 mb-1">Confirmation ID</p>
        <p className="font-mono font-bold text-blue-700 text-sm">
          #{data._id.slice(-8).toUpperCase()}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Your doctor will call you at the scheduled time.
        </p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={() => router.push('/account')}
          className="flex-1 border border-blue-200 text-blue-600 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors"
        >
          View Appointments
        </button>
        <button
          onClick={onHome}
          className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Booking state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultMode, setConsultMode] = useState<'video' | 'audio'>('video');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; publicId: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dates = getNext7Days();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({ resolver: zodResolver(schema) as any });

  // Fetch doctor
  useEffect(() => {
    setFetchLoading(true);
    setFetchError('');
    fetch(`/api/doctors/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDoctor(data.data);
          // Default date to today
          setSelectedDate(dates[0].fullDate);
        } else {
          setFetchError('Doctor not found');
        }
      })
      .catch(() => setFetchError('Failed to load doctor details'))
      .finally(() => setFetchLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Pricing calculations
  const fee = doctor?.consultationFee || 0;
  const finalAmount = Math.max(0, fee - couponDiscount);

  // Coupon apply
  function applyCoupon() {
    setCouponError('');
    setCouponSuccess('');
    const code = couponInput.trim().toUpperCase();
    if (code === 'AYRO20') {
      const disc = Math.round(fee * 0.2);
      setCouponDiscount(disc);
      setCouponApplied(code);
      setCouponSuccess(`Coupon applied! You save ₹${disc}`);
    } else if (code === 'FIRST100') {
      const disc = Math.min(100, fee);
      setCouponDiscount(disc);
      setCouponApplied(code);
      setCouponSuccess(`Coupon applied! You save ₹${disc}`);
    } else {
      setCouponError('Invalid coupon code');
      setCouponDiscount(0);
      setCouponApplied('');
    }
  }

  function removeCoupon() {
    setCouponInput('');
    setCouponApplied('');
    setCouponDiscount(0);
    setCouponError('');
    setCouponSuccess('');
  }

  // File upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        toastError('Only JPEG, PNG, and PDF files are allowed');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toastError('File size must be under 10MB');
        continue;
      }

      setUploading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/user/prescriptions/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          setUploadedFiles((prev) => [
            ...prev,
            { url: data.url, publicId: data.publicId || '', name: file.name },
          ]);
        } else {
          toastError(data.message || 'Upload failed');
        }
      } catch {
        toastError('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(idx: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // Submit
  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    if (!selectedDate) {
      toastError('Please select a date');
      return;
    }
    if (!selectedTime) {
      toastError('Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const body = {
        doctorSlug: slug,
        patientName: formData.patientName,
        patientMobile: formData.mobile,
        patientAge: formData.age,
        patientGender: formData.gender,
        symptoms: formData.symptoms || '',
        consultationMode: consultMode,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        couponCode: couponApplied || undefined,
        reportUrls: uploadedFiles.map(({ url, publicId }) => ({ url, publicId })),
      };

      const res = await fetch('/api/consult/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        toastSuccess('Appointment booked successfully!');
        setSuccessData({
          doctorName: doctor?.name || '',
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          consultationMode: consultMode,
          finalAmount: data.data.finalAmount,
          _id: data.data._id,
        });
      } else {
        toastError(data.error || 'Failed to book appointment');
      }
    } catch {
      toastError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render success state
  if (successData) {
    return <SuccessOverlay data={successData} onHome={() => router.push('/')} />;
  }

  // ── Loading state
  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ── Error state
  if (fetchError || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-gray-600 font-semibold">{fetchError || 'Doctor not found'}</p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const slotGroups = groupSlotsByPeriod(doctor.availableTimeSlots);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ── Back header ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
          <h1 className="text-base font-extrabold text-gray-900">Book Appointment</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── SECTION 1: Doctor Mini Card ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <Avatar name={doctor.name} photo={doctor.profilePhoto} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold text-gray-900">{doctor.name}</h2>
              {doctor.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {doctor.specialization}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {doctor.experience} yrs experience
              {doctor.languages?.length > 0 && ` · ${doctor.languages.slice(0, 2).join(', ')}`}
            </p>
          </div>
        </div>

        {/* ── SECTION 2: Select Date ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Select Date
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dates.map((d) => {
              const selected = selectedDate === d.fullDate;
              return (
                <button
                  key={d.fullDate}
                  onClick={() => { setSelectedDate(d.fullDate); setSelectedTime(''); }}
                  className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl min-w-[60px] transition-all duration-200 border ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${selected ? 'text-blue-200' : 'text-gray-400'}`}>
                    {d.dayAbbr}
                  </span>
                  <span className="text-lg font-black leading-none mt-0.5">{d.date}</span>
                  <span className={`text-[10px] font-medium ${selected ? 'text-blue-200' : 'text-gray-400'}`}>
                    {d.month}
                  </span>
                  {d.isToday && (
                    <span className={`text-[9px] font-bold mt-0.5 ${selected ? 'text-green-300' : 'text-green-500'}`}>
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: Select Time Slot ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Select Time Slot
          </p>
          {Object.entries(slotGroups).map(([period, slots]) => (
            <div key={period} className="mb-4 last:mb-0">
              <p className="text-xs font-bold text-gray-600 mb-2">{period}</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((slot, idx) => {
                  const disabled = isSlotDisabled(slots, idx);
                  const selected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] ${
                        disabled
                          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                          : selected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {slot}
                      {disabled && <span className="block text-[9px] font-normal normal-case no-underline">Booked</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── SECTION 4: Patient Details Form ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Patient Details
          </p>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('patientName')}
                type="text"
                placeholder="Enter patient name"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  errors.patientName
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white'
                }`}
              />
              {errors.patientName && (
                <p className="text-xs text-red-500 mt-1">{errors.patientName.message}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('mobile')}
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  errors.mobile
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white'
                }`}
              />
              {errors.mobile && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                {...register('age')}
                type="number"
                placeholder="Age in years"
                min={1}
                max={120}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
                  errors.age
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white'
                }`}
              />
              {errors.age && (
                <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGender(g);
                      setValue('gender', g, { shouldValidate: true });
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 capitalize min-h-[44px] ${
                      gender === g
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⊕ Other'}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Describe your symptoms <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                {...register('symptoms')}
                placeholder="Describe what you are experiencing..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-gray-50 focus:bg-white transition-colors resize-none"
              />
            </div>

            {/* Upload Report */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Upload Reports <span className="text-gray-400">(optional · max 10MB each)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-gray-400 hover:text-blue-600"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-semibold">
                  {uploading ? 'Uploading...' : 'Tap to upload images or PDF'}
                </span>
                <span className="text-[10px]">JPEG, PNG, PDF accepted</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-0.5 rounded-full hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Consultation Mode ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Consultation Mode
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { mode: 'video' as const, icon: Video, label: 'Video Call', desc: 'See the doctor face to face' },
              { mode: 'audio' as const, icon: Phone, label: 'Audio Call', desc: 'Talk to the doctor clearly' },
            ]).map(({ mode, icon: Icon, label, desc }) => {
              const avail = doctor.consultationModes?.includes(mode) ?? true;
              const selected = consultMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={!avail}
                  onClick={() => avail && setConsultMode(mode)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 min-h-[90px] ${
                    !avail
                      ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
                      : selected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${selected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 6: Coupon Code ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Coupon Code
          </p>
          {couponApplied ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <Tag className="w-4 h-4 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-green-700">{couponApplied} applied</p>
                <p className="text-xs text-green-600">{couponSuccess}</p>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                placeholder="Enter coupon code"
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors font-mono uppercase ${
                  couponError
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={!couponInput.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
          <p className="text-[10px] text-gray-400 mt-2">Try: AYRO20 (20% off) · FIRST100 (₹100 off)</p>
        </div>

        {/* ── SECTION 7: Bill Summary ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Bill Summary
          </p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Consultation Fee</span>
              <span className="font-semibold text-gray-900">₹{fee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Discount</span>
              <span className="font-semibold text-green-600">FREE</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Coupon ({couponApplied})</span>
                <span className="font-semibold text-green-600">-₹{couponDiscount}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="text-sm font-bold text-gray-900">Total Payable</span>
              <span className="text-lg font-black text-gray-900">₹{finalAmount}</span>
            </div>
          </div>
          <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs font-semibold text-green-700">Free Follow-up included (within 7 days)</p>
          </div>
        </div>

        {/* ── SECTION 8: Legal ────────────────────────────────────────── */}
        <p className="text-[11px] text-gray-400 leading-relaxed text-center px-2">
          By confirming, you agree to our{' '}
          <a href="/terms-of-service" className="underline hover:text-gray-600">
            Terms of Service
          </a>
          . Your consultation is private and confidential. This is not for emergency medical
          conditions — in case of emergency, please call 112.
        </p>

        {/* ── Desktop CTA ──────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={submitting || uploading}
          className="hidden lg:flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Booking...
            </>
          ) : (
            `Confirm Booking · ₹${finalAmount}`
          )}
        </button>
      </div>

      {/* ── STICKY BOTTOM BAR (mobile) ───────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900">₹{finalAmount} Total</p>
            {selectedDate && selectedTime ? (
              <p className="text-[10px] text-gray-500 truncate">
                {selectedDate} · {selectedTime}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400">Select date & time</p>
            )}
          </div>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={submitting || uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Booking...
              </>
            ) : (
              'Confirm Booking →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
