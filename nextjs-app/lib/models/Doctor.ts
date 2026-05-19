import mongoose, { Schema, Document, Model } from 'mongoose';
import { Doctor as DoctorType } from '@/types/doctor';

export interface DoctorDocument extends Omit<DoctorType, '_id'>, Document {}

const PhotoSchema = new Schema(
  { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
  { _id: false }
);

const FAQSchema = new Schema(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false }
);

const DoctorSchema = new Schema<DoctorDocument>(
  {
    // Basic
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    profilePhoto: { type: PhotoSchema, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    shortBio: { type: String, default: '' },
    about: { type: String, default: '' },
    languages: [{ type: String }],

    // Contact
    mobile: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },

    // Professional
    specialization: { type: String, required: true },
    experience: { type: Number, default: 0 },
    qualifications: [{ type: String }],
    registrationNumber: { type: String, default: '' },
    medicalCouncil: { type: String, default: '' },

    // Consultation
    consultationFee: { type: Number, default: 0 },
    followUpFee: { type: Number, default: 0 },
    consultationModes: [{ type: String, enum: ['video', 'audio'] }],
    consultationDuration: { type: Number, default: 15 },
    instantConsultation: { type: Boolean, default: false },

    // Availability
    availableDays: [{ type: String }],
    availableTimeSlots: [{ type: String }],
    maxPatientsPerDay: { type: Number, default: 20 },
    isOnline: { type: Boolean, default: true },

    // Content
    conditionsTreated: [{ type: String }],
    symptomsTreated: [{ type: String }],
    treatmentsOffered: [{ type: String }],
    aboutConsultation: { type: String, default: '' },

    // Status
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    // FAQ
    faqs: { type: [FAQSchema], default: [] },

    // SEO
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    seoKeywords: { type: String, default: '' },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true }
);

DoctorSchema.index({ slug: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ isPublished: 1, isDeleted: 1 });

const Doctor =
  (mongoose.models.Doctor as Model<DoctorDocument>) ||
  mongoose.model<DoctorDocument>('Doctor', DoctorSchema);

export default Doctor;
