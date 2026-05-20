'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Clock,
  Shield,
  FileText,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOP_CONCERNS = [
  { label: 'General Health', slug: 'general-physician', emoji: '🩺', bg: 'bg-blue-50', border: 'border-blue-100', textColor: 'text-blue-700' },
  { label: 'Child Care', slug: 'pediatrician', emoji: '👶', bg: 'bg-pink-50', border: 'border-pink-100', textColor: 'text-pink-700' },
  { label: "Women's Health", slug: 'gynecologist-obstetrician', emoji: '🌸', bg: 'bg-rose-50', border: 'border-rose-100', textColor: 'text-rose-700' },
  { label: 'Skin & Hair', slug: 'dermatologist', emoji: '✨', bg: 'bg-orange-50', border: 'border-orange-100', textColor: 'text-orange-700' },
  { label: 'Digestive Health', slug: 'gastroenterologist', emoji: '🫁', bg: 'bg-amber-50', border: 'border-amber-100', textColor: 'text-amber-700' },
  { label: 'Heart Health', slug: 'cardiologist', emoji: '❤️', bg: 'bg-red-50', border: 'border-red-100', textColor: 'text-red-700' },
  { label: 'Mental Wellness', slug: 'psychiatrist-psychologist', emoji: '🧠', bg: 'bg-purple-50', border: 'border-purple-100', textColor: 'text-purple-700' },
  { label: 'Bone & Joint', slug: 'orthopedic-surgeon', emoji: '🦴', bg: 'bg-cyan-50', border: 'border-cyan-100', textColor: 'text-cyan-700' },
];

const SYMPTOMS = [
  { label: '🤒 Fever', slug: 'general-physician' },
  { label: '🤧 Cough & Cold', slug: 'general-physician' },
  { label: '🤢 Stomach Ache', slug: 'gastroenterologist' },
  { label: '🌿 Skin Allergy', slug: 'dermatologist' },
  { label: '🤕 Headache', slug: 'general-physician' },
  { label: '💉 Diabetes', slug: 'general-physician' },
  { label: '🦴 Back Pain', slug: 'orthopedic-surgeon' },
  { label: '👁️ Eye Issue', slug: 'general-physician' },
  { label: '😰 Anxiety', slug: 'psychiatrist-psychologist' },
  { label: '🩺 Thyroid', slug: 'general-physician' },
];

const QUICK_TAGS = [
  'Blood Pressure', 'Diabetes', 'PCOD', 'Thyroid',
  'Arthritis', 'Hair Fall', 'Anxiety', 'Kidney',
];

const WHY_CHOOSE_US = [
  { icon: RefreshCw, title: 'Free Follow-up', desc: 'Consult again free within 7 days for same issue' },
  { icon: Clock, title: '24×7 Available', desc: 'Book anytime, consultations round the clock' },
  { icon: Shield, title: '100% Private', desc: 'All consultations encrypted and confidential' },
  { icon: FileText, title: 'Digital Prescription', desc: 'Get valid prescriptions instantly after consult' },
  { icon: BadgeCheck, title: 'Verified Doctors', desc: 'All doctors verified by Medical Council of India' },
];

const FAQS = [
  {
    q: 'How does online consultation work?',
    a: 'Book a slot, fill in your symptoms, and connect with your doctor via video or audio call at the scheduled time. You will receive a digital prescription after the consultation.',
  },
  {
    q: 'Is my health data safe?',
    a: 'Yes. All consultations are end-to-end encrypted. We never share your personal health data with third parties. Your privacy is our top priority.',
  },
  {
    q: 'Can I get a prescription online?',
    a: 'Yes, our doctors issue valid digital prescriptions after every consultation that are accepted at all major pharmacies across India.',
  },
  {
    q: 'What is the free follow-up policy?',
    a: 'You can consult the same doctor again within 7 days for the same health issue, completely free of charge. No additional booking required.',
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '200px' : '0px' }}
      >
        <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Left copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold tracking-wide">Doctors Available Now</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                Consult Certified Doctors Online — 24/7
              </h1>
              <p className="text-blue-100 text-base sm:text-lg mb-6 max-w-xl mx-auto lg:mx-0">
                Talk to India&apos;s best doctors from the comfort of your home
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
                <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-sm font-bold px-4 py-1.5 rounded-full">
                  Starting ₹199
                </span>
                <span className="bg-white/10 border border-white/20 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full">
                  🔄 Free Follow-up Included
                </span>
              </div>

              <button
                onClick={() => router.push('/consult/general-physician')}
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-base"
              >
                Consult Now <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8">
                {[
                  { icon: '🔒', label: '100% Private' },
                  { icon: '👨‍⚕️', label: '50K+ Consultations' },
                  { icon: '✅', label: '400+ Doctors' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-semibold text-blue-100">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right illustration */}
            <div className="shrink-0 flex items-center justify-center">
              <div className="w-40 h-40 sm:w-56 sm:h-56 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
                <span className="text-8xl sm:text-9xl select-none">🩺</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP CONCERNS GRID ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Consult by Specialty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          {TOP_CONCERNS.map(({ label, slug, emoji, bg, border, textColor }) => (
            <button
              key={slug}
              onClick={() => router.push(`/consult/${slug}`)}
              className={`${bg} ${border} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-md transition-all duration-200 text-center cursor-pointer`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── PROMO BANNER ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-lg font-extrabold mb-1">
                🎉 Get Free Follow-up on your first consultation
              </p>
              <p className="text-teal-100 text-sm">
                Use code{' '}
                <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-white font-mono">
                  AYRO20
                </span>{' '}
                for 20% off your first booking
              </p>
            </div>
            <button
              onClick={() => router.push('/consult/general-physician')}
              className="bg-white text-teal-700 font-bold px-6 py-2.5 rounded-xl hover:bg-teal-50 transition-colors shrink-0"
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      {/* ── FIND BY SYMPTOM ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Find by Symptom</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:pb-0">
          {SYMPTOMS.map(({ label, slug }) => (
            <button
              key={label}
              onClick={() => router.push(`/consult/${slug}`)}
              className="shrink-0 lg:shrink bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-sm font-medium px-4 py-2.5 rounded-2xl transition-all duration-200 whitespace-nowrap shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── SECOND OPINION CTA ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white text-center">
          <p className="text-xl font-black mb-2">A second opinion can change everything.</p>
          <p className="text-blue-100 text-sm mb-5 max-w-md mx-auto">
            Get expert advice from verified specialists — get a fresh perspective on your diagnosis
            and treatment plan.
          </p>
          <button
            onClick={() => router.push('/consult/general-physician')}
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Get Second Opinion <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── QUICK TAGS ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Browse by Condition</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide lg:flex-wrap lg:overflow-x-visible lg:pb-0">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => router.push('/consult/general-physician')}
              className="shrink-0 lg:shrink bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 whitespace-nowrap"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Why Consult on Ayropath?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WHY_CHOOSE_US.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
