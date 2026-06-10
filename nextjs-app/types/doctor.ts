import { z } from 'zod';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SPECIALIZATIONS = [
  'General Physician',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist / Obstetrician',
  'Cardiologist',
  'Psychiatrist / Psychologist',
  'Orthopedic Surgeon',
  'ENT Specialist',
  'Neurologist',
  'Gastroenterologist',
  'Endocrinologist',
  'Urologist',
  'Ophthalmologist',
  'Dentist',
  'Radiologist',
  'Oncologist',
  'Pulmonologist',
  'Nephrologist',
  'Rheumatologist',
  'Physiotherapist',
  'Nutritionist / Dietitian',
  'Ayurvedic Doctor',
  'Homeopathic Doctor',
  'Other',
] as const;

export const COMMON_QUALIFICATIONS = [
  'MBBS', 'MD', 'MS', 'BDS', 'MDS', 'DNB',
  'DM', 'M.Ch', 'PhD', 'BAMS', 'BHMS', 'BPT', 'MPT',
];

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const CONSULTATION_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const;

export const CONSULTATION_MODES = ['video', 'audio'] as const;
export type ConsultationMode = (typeof CONSULTATION_MODES)[number];

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

export interface DoctorImage {
  url: string;
  publicId: string;
}

export interface DoctorFAQ {
  question: string;
  answer: string;
}

export interface Doctor {
  _id: string;
  name: string;
  slug: string;
  profilePhoto: DoctorImage | null;
  gender: 'male' | 'female' | 'other' | '';
  shortBio: string;
  about: string;
  languages: string[];
  mobile: string;
  whatsapp: string;
  email: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  registrationNumber: string;
  medicalCouncil: string;
  consultationFee: number;
  followUpFee: number;
  consultationModes: ConsultationMode[];
  consultationDuration: number;
  instantConsultation: boolean;
  availableDays: string[];
  availableTimeSlots: string[];
  maxPatientsPerDay: number;
  isOnline: boolean;
  rating: number;
  totalPatientsConsulted: number;
  happyPatientPercentage: number;
  conditionsTreated: string[];
  symptomsTreated: string[];
  treatmentsOffered: string[];
  aboutConsultation: string;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  isPublished: boolean;
  isDraft: boolean;
  faqs: DoctorFAQ[];
  metaTitle: string;
  metaDescription: string;
  seoKeywords: string;
  isDeleted?: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

export const doctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  gender: z.enum(['male', 'female', 'other', '']).default(''),
  shortBio: z.string().optional().default(''),
  about: z.string().optional().default(''),
  languages: z.array(z.string()).default([]),
  mobile: z.string().optional().default(''),
  whatsapp: z.string().optional().default(''),
  email: z.string().email('Invalid email').optional().or(z.literal('')).default(''),

  specialization: z.string().min(1, 'Specialization is required'),
  experience: z.coerce.number().min(0).default(0),
  qualifications: z.array(z.string()).default([]),
  registrationNumber: z.string().optional().default(''),
  medicalCouncil: z.string().optional().default(''),

  consultationFee: z.coerce.number().min(0).default(0),
  followUpFee: z.coerce.number().min(0).default(0),
  consultationModes: z.array(z.enum(['video', 'audio'])).default(['video']),
  consultationDuration: z.coerce.number().min(5).default(15),
  instantConsultation: z.boolean().default(false),

  availableDays: z.array(z.string()).default([]),
  availableTimeSlots: z.array(z.string()).default([]),
  maxPatientsPerDay: z.coerce.number().min(1).default(20),
  isOnline: z.boolean().default(true),
  rating: z.coerce.number().min(0).max(5).default(0),
  totalPatientsConsulted: z.coerce.number().min(0).default(0),
  happyPatientPercentage: z.coerce.number().min(0).max(100).default(0),

  conditionsTreated: z.array(z.string()).default([]),
  symptomsTreated: z.array(z.string()).default([]),
  treatmentsOffered: z.array(z.string()).default([]),
  aboutConsultation: z.string().optional().default(''),

  isVerified: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  isDraft: z.boolean().default(true),

  faqs: z
    .array(
      z.object({
        question: z.string().min(1, 'Question is required'),
        answer: z.string().min(1, 'Answer is required'),
      })
    )
    .default([]),

  metaTitle: z.string().optional().default(''),
  metaDescription: z.string().optional().default(''),
  seoKeywords: z.string().optional().default(''),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;

export const DOCTOR_FORM_DEFAULTS: DoctorFormValues = {
  name: '',
  slug: '',
  gender: '',
  shortBio: '',
  about: '',
  languages: [],
  mobile: '',
  whatsapp: '',
  email: '',
  specialization: '',
  experience: 0,
  qualifications: [],
  registrationNumber: '',
  medicalCouncil: '',
  consultationFee: 0,
  followUpFee: 0,
  consultationModes: ['video'],
  consultationDuration: 15,
  instantConsultation: false,
  availableDays: [],
  availableTimeSlots: [],
  maxPatientsPerDay: 20,
  isOnline: true,
  rating: 0,
  totalPatientsConsulted: 0,
  happyPatientPercentage: 0,
  conditionsTreated: [],
  symptomsTreated: [],
  treatmentsOffered: [],
  aboutConsultation: '',
  isVerified: false,
  isFeatured: false,
  isActive: true,
  isPublished: false,
  isDraft: true,
  faqs: [],
  metaTitle: '',
  metaDescription: '',
  seoKeywords: '',
};

// ─── Doctor Portal Types (not used on public-facing pages) ────────────────────

export interface DoctorPortalProfile {
  _id: string;
  name: string;
  specialization: string;
  profilePhoto: { url: string; publicId: string } | null;
  loginUsername: string;
  slug: string;
}

export interface PrescriptionMedicine {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  medicines: PrescriptionMedicine[];
  notes: string;
  issuedAt: string;
}

export interface DoctorPortalAppointment {
  _id: string;
  patientName: string;
  patientMobile: string;
  patientEmail: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  symptoms: string;
  consultationMode: 'video' | 'audio';
  appointmentDate: string;
  appointmentTime: string;
  meetLink: string;
  consultationFee: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reportUrls: { url: string; publicId: string }[];
  prescription?: Prescription;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAuthData {
  token: string;
  expiresAt: number;
  doctor: DoctorPortalProfile;
}

export interface DoctorLoginResponse {
  success: boolean;
  token?: string;
  doctor?: DoctorPortalProfile;
  error?: string;
}
