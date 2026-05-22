import mongoose, { Schema, Document, Model } from 'mongoose';

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
  issuedAt: Date;
}

export interface ConsultationAppointmentDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  doctorSlug: string;
  doctorName: string;
  doctorMobile: string;
  patientName: string;
  patientMobile: string;
  patientEmail: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  symptoms: string;
  consultationMode: 'video' | 'audio';
  appointmentDate: string;
  appointmentTime: string;
  appointmentDateTime: Date;
  meetLink: string;
  consultationFee: number;
  platformDiscount: number;
  couponCode: string;
  couponDiscount: number;
  finalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reportUrls: { url: string; publicId: string }[];
  prescription?: Prescription;
  reminderSent: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportUrlSchema = new Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

const PrescriptionMedicineSchema = new Schema(
  {
    name:         { type: String, required: true, trim: true },
    dose:         { type: String, default: '' },
    frequency:    { type: String, default: '' },
    duration:     { type: String, default: '' },
    instructions: { type: String, default: '' },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema(
  {
    medicines: { type: [PrescriptionMedicineSchema], default: [] },
    notes:     { type: String, default: '' },
    issuedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConsultationAppointmentSchema = new Schema<ConsultationAppointmentDocument>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorSlug: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorMobile: { type: String, default: '' },

    patientName: { type: String, required: true, trim: true },
    patientMobile: { type: String, required: true },
    patientEmail: { type: String, default: '' },
    patientAge: { type: Number, required: true },
    patientGender: { type: String, enum: ['male', 'female', 'other'], required: true },

    symptoms: { type: String, default: '' },
    consultationMode: { type: String, enum: ['video', 'audio'], required: true },

    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    appointmentDateTime: { type: Date, required: true },
    meetLink: { type: String, default: '' },

    consultationFee: { type: Number, required: true },
    platformDiscount: { type: Number, default: 0 },
    couponCode: { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },

    reportUrls:   { type: [ReportUrlSchema], default: [] },
    prescription:  { type: PrescriptionSchema, default: undefined },
    reminderSent: { type: Boolean, default: false },

    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

ConsultationAppointmentSchema.index({ doctorSlug: 1 });
ConsultationAppointmentSchema.index({ userId: 1 });
ConsultationAppointmentSchema.index({ appointmentDate: 1, status: 1 });
ConsultationAppointmentSchema.index({ appointmentDateTime: 1, reminderSent: 1, status: 1 });

const ConsultationAppointment: Model<ConsultationAppointmentDocument> =
  (mongoose.models.ConsultationAppointment as Model<ConsultationAppointmentDocument>) ||
  mongoose.model<ConsultationAppointmentDocument>(
    'ConsultationAppointment',
    ConsultationAppointmentSchema
  );

export default ConsultationAppointment;
