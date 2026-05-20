'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck, Zap, RefreshCw, Star, ChevronRight } from 'lucide-react';
import { Doctor } from '@/types/doctor';

// ─── Specialty slug → display name map ────────────────────────────────────────

const SLUG_TO_SPECIALIZATION: Record<string, string> = {
  'general-physician': 'General Physician',
  'dermatologist': 'Dermatologist',
  'pediatrician': 'Pediatrician',
  'gynecologist-obstetrician': 'Gynecologist / Obstetrician',
  'cardiologist': 'Cardiologist',
  'psychiatrist-psychologist': 'Psychiatrist / Psychologist',
  'orthopedic-surgeon': 'Orthopedic Surgeon',
  'ent-specialist': 'ENT Specialist',
  'neurologist': 'Neurologist',
  'gastroenterologist': 'Gastroenterologist',
  'endocrinologist': 'Endocrinologist',
  'urologist': 'Urologist',
  'ophthalmologist': 'Ophthalmologist',
  'dentist': 'Dentist',
  'oncologist': 'Oncologist',
  'pulmonologist': 'Pulmonologist',
};

function slugToSpecialization(slug: string): string {
  if (SLUG_TO_SPECIALIZATION[slug]) return SLUG_TO_SPECIALIZATION[slug];
  return slug
    .split('-')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// ─── Fake stats helpers ────────────────────────────────────────────────────────

function getDoctorRating(id: string): string {
  const last = parseInt(id.slice(-1), 16) % 5;
  return (4.5 + last / 10).toFixed(1);
}

function getDoctorConsults(id: string): string {
  const last2 = parseInt(id.slice(-2), 16);
  const n = 800 + last2 * 50;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
}

function getMrp(fee: number): number {
  return Math.round((fee * 1.5) / 50) * 50;
}

function getDiscountPct(fee: number, mrp: number): number {
  return Math.round(((mrp - fee) / mrp) * 100);
}

// ─── Avatar fallback ──────────────────────────────────────────────────────────

function Avatar({ name, photo }: { name: string; photo?: { url: string } | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (photo?.url) {
    return (
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-100 shrink-0">
        <Image src={photo.url} alt={name} fill className="object-cover" sizes="64px" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 border-2 border-blue-100">
      <span className="text-white font-bold text-lg">{initials}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DoctorSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="w-24 space-y-2 shrink-0">
          <div className="h-6 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Promo Banner ─────────────────────────────────────────────────────────────

function PromoBanner({ index }: { index: number }) {
  const banners = [
    { bg: 'bg-emerald-50 border-emerald-100', text: '💊 Get medicines delivered at home', cta: 'Shop on Medicines', href: '/medicines' },
    { bg: 'bg-blue-50 border-blue-100', text: '🆓 Free follow-up within 7 days', cta: 'Book now', href: '/consult' },
  ];
  const b = banners[index % banners.length];
  return (
    <div className={`${b.bg} border rounded-2xl px-5 py-3.5 flex items-center justify-between`}>
      <span className="text-sm font-semibold text-gray-700">{b.text}</span>
      <a href={b.href} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
        {b.cta} <ChevronRight className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  const rating = getDoctorRating(doctor._id);
  const consults = getDoctorConsults(doctor._id);
  const mrp = getMrp(doctor.consultationFee);
  const discountPct = getDiscountPct(doctor.consultationFee, mrp);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 p-4 cursor-pointer"
      onClick={() => router.push('/consult/book/' + doctor.slug)}
    >
      {/* ── Row 1: Avatar + Name/Specialty/Experience ── */}
      <div className="flex gap-3 mb-3">
        <Avatar name={doctor.name} photo={doctor.profilePhoto} />

        <div className="flex-1 min-w-0">
          {/* Name + Verified badge */}
          <div className="flex items-start gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-bold text-gray-900 leading-snug break-words">
              {doctor.name}
            </h3>
            {doctor.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                <BadgeCheck className="w-2.5 h-2.5" /> Verified
              </span>
            )}
          </div>

          {/* Specialization */}
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-0.5 truncate">
            {doctor.specialization}
          </p>

          {/* Experience + Qualifications */}
          <p className="text-[11px] text-gray-500 truncate">
            {doctor.experience} yrs exp
            {doctor.qualifications?.length > 0
              ? ` · ${doctor.qualifications.slice(0, 2).join(', ')}`
              : ''}
          </p>
        </div>
      </div>

      {/* ── Row 2: Stats ── */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mb-2.5">
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {rating}
        </span>
        <span className="text-gray-200 text-xs">|</span>
        <span className="text-[11px] text-gray-500">{consults} consults</span>
        <span className="text-gray-200 text-xs">|</span>
        <span className="text-[11px] font-semibold text-green-600">98% satisfied</span>
      </div>

      {/* ── Row 3: Symptom tags ── */}
      {doctor.symptomsTreated?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {doctor.symptomsTreated.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* ── Row 4: Badges + Languages ── */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {doctor.instantConsultation && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
            <Zap className="w-2.5 h-2.5" /> Instant
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
          <RefreshCw className="w-2.5 h-2.5" /> Free Follow-up
        </span>
        {doctor.languages?.length > 0 && (
          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {doctor.languages.slice(0, 2).join(' · ')}
          </span>
        )}
      </div>

      {/* ── Row 5: Price + CTA + Availability ── */}
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-black text-gray-900">₹{doctor.consultationFee}</span>
            <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              {discountPct}% off
            </span>
          </div>
          <p className="text-[10px] font-semibold mt-0.5">
            {doctor.isOnline ? (
              <span className="text-green-600">● Available Today, 7:00 AM</span>
            ) : (
              <span className="text-gray-400">Next available: Tomorrow</span>
            )}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push('/consult/book/' + doctor.slug);
          }}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          Select Slot
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SpecialtyPage({
  params,
}: {
  params: Promise<{ specialty: string }>;
}) {
  const { specialty } = use(params);
  const router = useRouter();
  const specialization = slugToSpecialization(specialty);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/doctors?specialty=${encodeURIComponent(specialization)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDoctors(data.data || []);
        } else {
          setError('Failed to load doctors');
        }
      })
      .catch(() => setError('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, [specialization]);

  // Interleave promo banners after every 2 doctor cards
  const renderList = () => {
    const items: React.ReactNode[] = [];
    let bannerIdx = 0;
    doctors.forEach((doc, i) => {
      items.push(<DoctorCard key={doc._id} doctor={doc} />);
      if ((i + 1) % 2 === 0 && i < doctors.length - 1) {
        items.push(<PromoBanner key={`promo-${bannerIdx}`} index={bannerIdx} />);
        bannerIdx++;
      }
    });
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header strip */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">{specialization}</h1>
            {!loading && (
              <p className="text-xs text-gray-500">
                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading && (
          <>
            <DoctorSkeleton />
            <DoctorSkeleton />
            <DoctorSkeleton />
          </>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-semibold text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs font-bold text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center shadow-sm">
            <span className="text-5xl mb-4 block">👨‍⚕️</span>
            <p className="text-base font-bold text-gray-900 mb-2">
              No doctors found for {specialization}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              We&apos;re adding more doctors in this specialty. Try browsing other specialties in the
              meantime.
            </p>
            <button
              onClick={() => router.push('/consult')}
              className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
            >
              Browse All Specialties
            </button>
          </div>
        )}

        {!loading && !error && doctors.length > 0 && renderList()}
      </div>
    </div>
  );
}
