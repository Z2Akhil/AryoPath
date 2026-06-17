import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, Video, Phone, ChevronRight, Star, Users, Smile } from 'lucide-react';
import connectToDatabase from '@/lib/db/mongoose';
import Doctor from '@/lib/models/Doctor';
import ConsultFAQ from './ConsultFAQ';

export const revalidate = 3600;

// ─── Specialties ──────────────────────────────────────────────────────────────

const ALL_SPECIALTIES = [
  { label: 'General Physician',    slug: 'general-physician',           icon: '🩺', keywords: ['general physician', 'general practice', 'physician'] },
  { label: 'Dermatologist',        slug: 'dermatologist',               icon: '✨', keywords: ['dermatolog', 'skin'] },
  { label: "Women's Health",       slug: 'gynecologist-obstetrician',   icon: '🌸', keywords: ['gynecolog', 'obstet', 'women'] },
  { label: 'Paediatrics',          slug: 'pediatrician',                icon: '👶', keywords: ['pediatric', 'child'] },
  { label: 'Cardiology',           slug: 'cardiologist',                icon: '❤️', keywords: ['cardio', 'heart'] },
  { label: 'Psychiatry',           slug: 'psychiatrist-psychologist',   icon: '🧠', keywords: ['psychiatr', 'psycholog', 'mental'] },
  { label: 'Orthopaedics',         slug: 'orthopedic-surgeon',          icon: '🦴', keywords: ['orthop', 'bone', 'joint'] },
  { label: 'Gastroenterology',     slug: 'gastroenterologist',          icon: '🫁', keywords: ['gastro', 'digest'] },
  { label: 'ENT Specialist',       slug: 'ent-specialist',              icon: '👂', keywords: ['ent', 'ear', 'nose', 'throat'] },
  { label: 'Neurology',            slug: 'neurologist',                 icon: '🧬', keywords: ['neurol', 'brain', 'nerve'] },
  { label: 'Endocrinology',        slug: 'endocrinologist',             icon: '⚗️', keywords: ['endocrin', 'thyroid', 'diabetes'] },
  { label: 'Urology',              slug: 'urologist',                   icon: '💧', keywords: ['urol', 'kidney'] },
  { label: 'Ophthalmology',        slug: 'ophthalmologist',             icon: '👁️', keywords: ['ophthal', 'eye'] },
  { label: 'Pulmonology',          slug: 'pulmonologist',               icon: '🫀', keywords: ['pulmon', 'lung', 'respir'] },
  { label: 'Dentist',              slug: 'dentist',                     icon: '🦷', keywords: ['dent', 'oral'] },
  { label: 'Diabetology',          slug: 'general-physician',           icon: '🩸', keywords: ['diabet'] },
];

const FALLBACK_SYMPTOMS = [
  { label: 'Fever',          slug: 'general-physician' },
  { label: 'Cough & Cold',   slug: 'general-physician' },
  { label: 'Stomach Ache',   slug: 'gastroenterologist' },
  { label: 'Skin Allergy',   slug: 'dermatologist' },
  { label: 'Headache',       slug: 'general-physician' },
  { label: 'Diabetes',       slug: 'general-physician' },
  { label: 'Back Pain',      slug: 'orthopedic-surgeon' },
  { label: 'Anxiety',        slug: 'psychiatrist-psychologist' },
  { label: 'Thyroid',        slug: 'general-physician' },
  { label: 'PCOD / PCOS',    slug: 'gynecologist-obstetrician' },
  { label: 'Hair Fall',      slug: 'dermatologist' },
  { label: 'Blood Pressure', slug: 'general-physician' },
];

const SPECIALTIES_ABOUT = [
  { title: 'General Physician / Internal Medicine', desc: 'Highly experienced medical doctors providing broad non-surgical medical care and health consultation for adult patients.' },
  { title: 'Dermatology', desc: 'Specialised branch focusing on hair, nails, skin-related disorders and conditions affecting the skin.' },
  { title: "Women's Health / Gynaecology", desc: 'Two major medical specialities focusing on women\'s reproductive health, obstetrics, childbirth, and after-delivery care.' },
  { title: 'Paediatrics', desc: 'Focused on the health and medical care of children, infants, and young adults.' },
  { title: 'Psychiatry', desc: 'Specialised area focusing on the detection, treatment, and prevention of emotional, behavioural, and mental health disorders.' },
  { title: 'Cardiology', desc: 'Speciality of internal medicine concerned with heart-related disorders including electrophysiology and congenital heart defects.' },
  { title: 'Gastroenterology / GI Medicine', desc: 'Focuses on the functions and diseases of the digestive system, liver bile ducts, gallbladder, and pancreas.' },
  { title: 'Orthopaedics', desc: 'Branch of medicine that majorly focuses on treating injuries and diseases related to the musculoskeletal system of the body.' },
];

// ─── Doctor avatar ─────────────────────────────────────────────────────────────

function DoctorAvatar({ name, photo }: { name: string; photo?: { url: string } | null }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  if (photo?.url) {
    return (
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-blue-100 shrink-0">
        <Image src={photo.url} alt={name} fill className="object-cover" sizes="80px" />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-xl sm:text-2xl border-2 border-blue-100">
      {initials}
    </div>
  );
}

// ─── Doctor card (horizontal list style like Apollo) ──────────────────────────

function DoctorCard({ doc }: { doc: any }) {
  return (
    <Link
      href={`/consult/book/${doc.slug}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 p-4 flex flex-col gap-3 w-72 sm:w-auto shrink-0 sm:shrink"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <DoctorAvatar name={doc.name} photo={doc.profilePhoto} />
          {doc.isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">{doc.name}</h3>
            {doc.isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
          </div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide truncate mb-0.5">
            {doc.specialization}
          </p>
          <p className="text-xs text-gray-500">
            {doc.experience > 0 ? `${doc.experience} yrs exp` : 'Experienced'}
            {doc.qualifications?.length > 0 ? ` · ${doc.qualifications[0]}` : ''}
          </p>
          {doc.languages?.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-1 truncate">
              {doc.languages.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      {(doc.rating > 0 || doc.totalPatientsConsulted > 0 || doc.happyPatientPercentage > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {doc.rating > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {doc.rating}
            </span>
          )}
          {doc.totalPatientsConsulted > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Users className="w-3 h-3 text-blue-400" />
              {doc.totalPatientsConsulted >= 1000
                ? `${(doc.totalPatientsConsulted / 1000).toFixed(1)}K`
                : doc.totalPatientsConsulted} patients
            </span>
          )}
          {doc.happyPatientPercentage > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-green-600">
              <Smile className="w-3 h-3" />
              {doc.happyPatientPercentage}% happy
            </span>
          )}
        </div>
      )}

      {/* Modes + fee */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-1.5">
          {doc.consultationModes?.includes('video') && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
              <Video className="w-3 h-3" /> Video
            </span>
          )}
          {doc.consultationModes?.includes('audio') && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
              <Phone className="w-3 h-3" /> Audio
            </span>
          )}
        </div>
        {doc.consultationFee > 0 ? (
          <span className="text-base font-extrabold text-blue-700">₹{doc.consultationFee}</span>
        ) : (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Free</span>
        )}
      </div>

      {/* Book button */}
      <div className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl text-center transition-colors">
        Book Appointment
      </div>
    </Link>
  );
}

// ─── Specialty tile ────────────────────────────────────────────────────────────

function SpecialtyTile({ label, slug, icon }: { label: string; slug: string; icon: string }) {
  return (
    <Link
      href={`/consult/${slug}`}
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all duration-150 text-center group"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-semibold text-gray-700 leading-tight line-clamp-2 break-words w-full">
        {label}
      </span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConsultPage() {
  await connectToDatabase();

  const activeFilter = { isActive: true, isPublished: true, isDeleted: { $ne: true } };

  const [totalDoctors, doctorDocs, rawSpecs] = await Promise.all([
    Doctor.countDocuments(activeFilter),
    Doctor.find({ ...activeFilter, isFeatured: true })
      .select('name specialization experience consultationFee consultationModes profilePhoto isVerified isOnline slug qualifications languages rating totalPatientsConsulted happyPatientPercentage')
      .sort({ experience: -1 })
      .limit(10)
      .lean(),
    Doctor.distinct('specialization', activeFilter),
  ]);

  const doctors = JSON.parse(JSON.stringify(doctorDocs));

  const dbSpecsLower = (rawSpecs as string[]).map((s: string) => s.toLowerCase());
  const specialties = dbSpecsLower.length > 0
    ? ALL_SPECIALTIES.filter((s) => s.keywords.some((kw) => dbSpecsLower.some((ds) => ds.includes(kw))))
    : ALL_SPECIALTIES;
  const specialtiesToShow = specialties.length >= 4 ? specialties : ALL_SPECIALTIES;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO BANNER (compact, like Apollo) ────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black mb-1 leading-tight">
              Talk to a Doctor from Home
            </h1>
            <p className="text-blue-100 text-sm mb-4">
              Verified specialists · Digital prescription
            </p>
            <Link
              href="/consult/general-physician"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow"
            >
              <Video className="w-4 h-4" /> Consult Now
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── FEATURED DOCTORS ──────────────────────────────────────────────── */}
        <section className="pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Featured Doctors</h2>
              {totalDoctors > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{totalDoctors} verified specialists available</p>
              )}
            </div>
            <Link
              href="/consult/all"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {doctors.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="sm:hidden flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                {doctors.map((doc: any) => (
                  <div key={doc.slug} className="snap-start shrink-0 w-72">
                    <DoctorCard doc={doc} />
                  </div>
                ))}
              </div>
              {/* Desktop: 3-col grid */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc: any) => (
                  <DoctorCard key={doc.slug} doc={doc} />
                ))}
              </div>
            </>
          ) : (
            /* Placeholder when DB is empty */
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-3 -mx-4 px-4">
              {[
                { name: 'Dr. Ananya Sharma',  spec: 'General Physician', exp: 8,  fee: 299 },
                { name: 'Dr. Rohan Mehta',    spec: 'Cardiologist',      exp: 12, fee: 499 },
                { name: 'Dr. Priya Nair',     spec: 'Dermatologist',     exp: 6,  fee: 399 },
              ].map((d) => (
                <Link
                  key={d.name}
                  href="/consult/general-physician"
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 w-72 shrink-0 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {d.name.split(' ').slice(1, 3).map((w) => w[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{d.name}</p>
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{d.spec}</p>
                      <p className="text-xs text-gray-500">{d.exp} yrs exp</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                      <Video className="w-3 h-3" /> Video
                    </span>
                    <span className="text-base font-extrabold text-blue-700">₹{d.fee}</span>
                  </div>
                  <div className="bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl text-center">
                    Book Appointment
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── BROWSE BY SPECIALTY ───────────────────────────────────────────── */}
        <section className="py-6 border-t border-gray-200 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Browse by Specialties</h2>
            <Link
              href="/consult/all"
              className="flex items-center gap-1 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {specialtiesToShow.map(({ label, slug, icon }) => (
              <SpecialtyTile key={slug + label} label={label} slug={slug} icon={icon} />
            ))}
          </div>
        </section>

        {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
        <section className="py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { n: totalDoctors > 0 ? `${totalDoctors}+` : '50+', label: 'Verified Doctors',    icon: '👨‍⚕️' },
              { n: '50K+',                                          label: 'Consultations Done', icon: '✅' },
              { n: '4.8★',                                          label: 'Average Rating',     icon: '⭐' },
              { n: '100%',                                          label: 'Private & Secure',   icon: '🔒' },
            ].map(({ n, label, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 shadow-sm">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <p className="text-sm sm:text-base font-extrabold text-gray-900">{n}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FIND BY SYMPTOM ───────────────────────────────────────────────── */}
        <section className="py-6 border-t border-gray-200">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-1">Find by Symptom</h2>
          <p className="text-xs text-gray-500 mb-4">Not sure which specialist? Start with what you feel.</p>
          <div className="flex flex-wrap gap-2">
            {FALLBACK_SYMPTOMS.map(({ label, slug }) => (
              <Link
                key={label}
                href={`/consult/${slug}`}
                className="bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-150 shadow-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── SPECIALTIES ABOUT TEXT (like Apollo footer content) ───────────── */}
        <section className="py-6 border-t border-gray-200">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2">
            Ayropath Specialities — Expertise You Can Trust
          </h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            A medical specialty is a specific area of medical practice that mainly focuses on a defined set of diseases, patients, philosophy, or skills. Ayropath offers advanced services for a range of medical specialities, including:
          </p>
          <ul className="space-y-3">
            {SPECIALTIES_ABOUT.map(({ title, desc }) => (
              <li key={title} className="text-sm text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-900">{title}</span>
                {' — '}
                {desc}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">Why Choose Online Consultation?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Reach a doctor without visiting a hospital or clinic. Online consultations make expert medical care accessible, affordable, and convenient from home.
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Consult verified specialists from any device, anytime',
                'Get a digital prescription valid at all major pharmacies',
                'Private and confidential — end-to-end encrypted sessions',
                'Book same-day appointments, no waiting rooms',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <ConsultFAQ />
      </div>

    </div>
  );
}
