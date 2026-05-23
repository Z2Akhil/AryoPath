import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, RefreshCw, Clock, Shield, FileText, BadgeCheck, CheckCircle, Video, Phone, Star } from 'lucide-react';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import ConsultFAQ from './ConsultFAQ';

export const revalidate = 3600;

// ─── Static data ──────────────────────────────────────────────────────────────

const SPECIALTY_MAP = [
  { label: 'General Physician', slug: 'general-physician',          icon: '🩺', color: 'blue',   keywords: ['general physician', 'general practice', 'physician'] },
  { label: 'Dermatologist',     slug: 'dermatologist',              icon: '✨', color: 'orange', keywords: ['dermatolog', 'skin'] },
  { label: "Women's Health",    slug: 'gynecologist-obstetrician',  icon: '🌸', color: 'rose',   keywords: ['gynecolog', 'obstet', 'women'] },
  { label: 'Child Care',        slug: 'pediatrician',               icon: '👶', color: 'pink',   keywords: ['pediatric', 'child'] },
  { label: 'Heart Health',      slug: 'cardiologist',               icon: '❤️', color: 'red',    keywords: ['cardio', 'heart'] },
  { label: 'Mental Wellness',   slug: 'psychiatrist-psychologist',  icon: '🧠', color: 'purple', keywords: ['psychiatr', 'psycholog', 'mental'] },
  { label: 'Bone & Joint',      slug: 'orthopedic-surgeon',         icon: '🦴', color: 'cyan',   keywords: ['orthop', 'bone', 'joint'] },
  { label: 'Digestive Health',  slug: 'gastroenterologist',         icon: '🫁', color: 'amber',  keywords: ['gastro', 'digest'] },
];

const COLOR_MAP: Record<string, { pill: string; hover: string }> = {
  blue:   { pill: 'bg-blue-50 text-blue-700',     hover: 'hover:bg-blue-50 hover:border-blue-200' },
  orange: { pill: 'bg-orange-50 text-orange-700', hover: 'hover:bg-orange-50 hover:border-orange-200' },
  rose:   { pill: 'bg-rose-50 text-rose-700',     hover: 'hover:bg-rose-50 hover:border-rose-200' },
  pink:   { pill: 'bg-pink-50 text-pink-700',     hover: 'hover:bg-pink-50 hover:border-pink-200' },
  red:    { pill: 'bg-red-50 text-red-700',       hover: 'hover:bg-red-50 hover:border-red-200' },
  purple: { pill: 'bg-purple-50 text-purple-700', hover: 'hover:bg-purple-50 hover:border-purple-200' },
  cyan:   { pill: 'bg-cyan-50 text-cyan-700',     hover: 'hover:bg-cyan-50 hover:border-cyan-200' },
  amber:  { pill: 'bg-amber-50 text-amber-700',   hover: 'hover:bg-amber-50 hover:border-amber-200' },
};

const FALLBACK_SYMPTOMS = [
  { label: 'Fever',         slug: 'general-physician' },
  { label: 'Cough & Cold',  slug: 'general-physician' },
  { label: 'Stomach Ache',  slug: 'gastroenterologist' },
  { label: 'Skin Allergy',  slug: 'dermatologist' },
  { label: 'Headache',      slug: 'general-physician' },
  { label: 'Diabetes',      slug: 'general-physician' },
  { label: 'Back Pain',     slug: 'orthopedic-surgeon' },
  { label: 'Anxiety',       slug: 'psychiatrist-psychologist' },
  { label: 'Thyroid',       slug: 'general-physician' },
  { label: 'PCOD',          slug: 'gynecologist-obstetrician' },
  { label: 'Hair Fall',     slug: 'dermatologist' },
  { label: 'Blood Pressure',slug: 'general-physician' },
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Choose a Specialty', desc: 'Select the type of doctor you need — general physician, specialist, or more.' },
  { n: '02', title: 'Pick a Time Slot',   desc: 'Browse available doctors and book a convenient time slot.' },
  { n: '03', title: 'Consult & Receive',  desc: 'Join via video or audio call and get a digital prescription instantly.' },
];

const WHY_US = [
  { icon: BadgeCheck, title: 'Verified Doctors',    desc: 'All verified by MCI' },
  { icon: Shield,     title: '100% Private',         desc: 'End-to-end encrypted' },
  { icon: RefreshCw,  title: 'Free Follow-up',       desc: 'Within 7 days' },
  { icon: FileText,   title: 'Digital Prescription', desc: 'Valid at all pharmacies' },
  { icon: Clock,      title: '24 × 7 Available',     desc: 'Round the clock' },
];

// ─── Avatar helper ────────────────────────────────────────────────────────────

function DoctorAvatar({ name, photo }: { name: string; photo?: { url: string } | null }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (photo?.url) {
    return (
      <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-100 shrink-0">
        <Image src={photo.url} alt={name} fill className="object-cover" sizes="56px" />
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-lg">
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConsultPage() {
  await connectToDatabase();

  const [totalDoctors, featuredDocRaw, rawSpecs, symptomDocs] = await Promise.all([
    Doctor.countDocuments({ isActive: true, isPublished: true, isDeleted: { $ne: true } }),
    Doctor.findOne({ isActive: true, isPublished: true, isDeleted: { $ne: true }, isFeatured: true })
      .select('name specialization experience consultationFee consultationModes profilePhoto isVerified isOnline slug qualifications languages')
      .lean(),
    Doctor.distinct('specialization', { isActive: true, isPublished: true, isDeleted: { $ne: true } }),
    Doctor.find({ isActive: true, isPublished: true, isDeleted: { $ne: true } })
      .select('symptomsTreated conditionsTreated -_id')
      .limit(50)
      .lean(),
  ]);

  const featuredDoc = featuredDocRaw ? JSON.parse(JSON.stringify(featuredDocRaw)) : null;

  // Filter specialties to only those present in DB (fallback to all if DB empty)
  const dbSpecsLower = (rawSpecs as string[]).map((s) => s.toLowerCase());
  const specialties =
    dbSpecsLower.length > 0
      ? SPECIALTY_MAP.filter((s) => s.keywords.some((kw) => dbSpecsLower.some((ds) => ds.includes(kw))))
      : SPECIALTY_MAP;
  const specialtiesToShow = specialties.length > 0 ? specialties : SPECIALTY_MAP;

  // Collect unique symptoms from DB, fall back to static list
  const symptomsSet = new Set<string>();
  (symptomDocs as any[]).forEach((d) => {
    [...(d.symptomsTreated || []), ...(d.conditionsTreated || [])].forEach((s: string) => {
      if (s) symptomsSet.add(s);
    });
  });
  const dbSymptomLabels = Array.from(symptomsSet).slice(0, 12);

  // Symptoms need a slug — map DB symptoms to specialty slug by keyword, fallback to general-physician
  const SYMPTOM_SLUG_MAP: Record<string, string> = {
    skin: 'dermatologist', hair: 'dermatologist', acne: 'dermatologist', eczema: 'dermatologist',
    heart: 'cardiologist', cardiac: 'cardiologist', chest: 'cardiologist',
    stomach: 'gastroenterologist', gastro: 'gastroenterologist', digestion: 'gastroenterologist', ibs: 'gastroenterologist',
    bone: 'orthopedic-surgeon', joint: 'orthopedic-surgeon', knee: 'orthopedic-surgeon', back: 'orthopedic-surgeon',
    anxiety: 'psychiatrist-psychologist', depression: 'psychiatrist-psychologist', mental: 'psychiatrist-psychologist',
    child: 'pediatrician', pediatric: 'pediatrician',
    pcod: 'gynecologist-obstetrician', pcos: 'gynecologist-obstetrician', period: 'gynecologist-obstetrician',
  };

  const symptomsToShow =
    dbSymptomLabels.length > 0
      ? dbSymptomLabels.map((label) => {
          const lower = label.toLowerCase();
          const slug = Object.entries(SYMPTOM_SLUG_MAP).find(([kw]) => lower.includes(kw))?.[1] ?? 'general-physician';
          return { label, slug };
        })
      : FALLBACK_SYMPTOMS;

  const doctorCountLabel = totalDoctors > 0 ? `${totalDoctors}+` : '50+';

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 mb-4 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {totalDoctors > 0 ? `${totalDoctors} Doctors Available` : 'Doctors Available Now'}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                Talk to a Doctor<br className="hidden sm:block" /> from Home — 24/7
              </h1>
              <p className="text-blue-100 text-sm sm:text-base mb-7 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Consult verified specialists via video or audio. Get digital prescriptions, free follow-ups, and expert care — starting at ₹199.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/consult/general-physician"
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5 text-sm"
                >
                  <Video className="w-4 h-4" /> Consult Now
                </Link>
                <Link
                  href="/consult/general-physician"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/20 transition-all text-sm"
                >
                  <Phone className="w-4 h-4" /> Audio Call
                </Link>
              </div>
            </div>

            {/* Doctor card — real data or placeholder */}
            <div className="shrink-0 w-full max-w-xs lg:max-w-sm">
              {featuredDoc ? (
                <div className="bg-white rounded-3xl shadow-2xl p-5 text-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Featured Doctor</span>
                    {featuredDoc.isOnline && (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <DoctorAvatar name={featuredDoc.name} photo={featuredDoc.profilePhoto} />
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 text-sm truncate">{featuredDoc.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{featuredDoc.specialization}</p>
                      {featuredDoc.experience > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{featuredDoc.experience} yrs experience</p>
                      )}
                      <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mb-4" />

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-2">
                      {featuredDoc.consultationModes?.includes('video') && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                          <Video className="w-3 h-3" /> Video
                        </span>
                      )}
                      {featuredDoc.consultationModes?.includes('audio') && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <Phone className="w-3 h-3" /> Audio
                        </span>
                      )}
                    </div>
                    {featuredDoc.consultationFee > 0 && (
                      <span className="text-lg font-black text-blue-700">₹{featuredDoc.consultationFee}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-4">
                    {featuredDoc.isVerified && (
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> MCI Verified</span>
                    )}
                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 text-blue-500" /> Free Follow-up</span>
                  </div>

                  <Link
                    href={`/consult/book/${featuredDoc.slug}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    Book Appointment <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                /* No featured doctor — show a trust card instead */
                <div className="bg-white rounded-3xl shadow-2xl p-6 text-gray-900 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">👨‍⚕️</div>
                  <p className="font-extrabold text-gray-900 mb-1">Verified Specialists</p>
                  <p className="text-sm text-gray-500 mb-4">Consult doctors across {specialtiesToShow.length}+ specialties</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-5">
                    {[
                      { icon: BadgeCheck, text: 'MCI Verified' },
                      { icon: Shield,     text: '100% Private' },
                      { icon: RefreshCw,  text: 'Free Follow-up' },
                      { icon: FileText,   text: 'Digital Rx' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
                        <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {text}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/consult/general-physician"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    View Doctors <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-white/10 bg-black/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-center lg:justify-between gap-x-6 gap-y-2">
            {[
              { n: doctorCountLabel, label: 'Verified Doctors' },
              { n: '50K+',          label: 'Consultations Done' },
              { n: '4.8★',          label: 'Average Rating' },
              { n: '7-day',         label: 'Free Follow-up' },
            ].map(({ n, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-blue-100">
                <span className="text-white font-black text-sm">{n}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 relative">
            <div className="hidden sm:block absolute top-8 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-blue-100 z-0" />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.n} className={`relative z-10 flex flex-col items-center text-center px-6 pb-8 sm:pb-0 ${i < 2 ? 'border-b sm:border-b-0 border-gray-100' : ''}`}>
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                  {step.n}
                </div>
                <p className="font-bold text-gray-900 text-sm mb-1">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES ──────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Consult by Specialty</h2>
          <p className="text-sm text-gray-500 mt-1">Choose the right specialist for your health concern</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {specialtiesToShow.map(({ label, slug, icon, color }) => {
            const c = COLOR_MAP[color];
            return (
              <Link
                key={slug}
                href={`/consult/${slug}`}
                className={`group bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-center ${c.hover}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.pill}`}>
                  {icon}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-800 leading-tight">{label}</span>
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Book now <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-8 text-center">Why Ayropath?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm flex flex-col items-center text-center gap-2 hover:border-blue-100 hover:shadow-md transition-all duration-200">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{title}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIND BY SYMPTOM ──────────────────────────────────────────────────── */}
      {symptomsToShow.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">Find by Symptom</h2>
          <p className="text-sm text-gray-500 mb-6">Not sure which specialist? Start with what you feel.</p>
          <div className="flex flex-wrap gap-2.5">
            {symptomsToShow.map(({ label, slug }) => (
              <Link
                key={label}
                href={`/consult/${slug}`}
                className="bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-sm font-medium px-4 py-2 rounded-full transition-all duration-150 shadow-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-blue-600 rounded-3xl px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white">
          <div>
            <p className="text-xl sm:text-2xl font-black mb-1">Book your first consultation today</p>
            <p className="text-blue-100 text-sm leading-relaxed">Starting at ₹199 · Free follow-up included · No prescription needed to book</p>
          </div>
          <Link
            href="/consult/general-physician"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors shadow-md text-sm w-full sm:w-auto justify-center"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <ConsultFAQ />

    </div>
  );
}
