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

export interface ConsultPayment {
  cfOrderId:   string;
  cfPaymentId: string;
  status: 'pending' | 'paid' | 'failed' | 'not_required';
  amount: number;
  paidAt?: Date;
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'refunded';
  reportUrls: { url: string; publicId: string }[];
  prescription?: Prescription;
  payment?: ConsultPayment;
  reminderSent: boolean;
  userId?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  bookedByAdmin?: boolean;
  paymentLink?: { linkId?: string; url?: string; expiresAt?: Date };
  sourceHoldId?: string;
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

const ConsultPaymentSchema = new Schema(
  {
    cfOrderId:   { type: String, default: '' },
    cfPaymentId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'not_required'],
      default: 'pending',
    },
    amount: { type: Number, default: 0 },
    paidAt: { type: Date },
    refundId:          { type: String, default: '' },
    refundAmount:      { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'initiated', 'pending', 'processed', 'failed'],
      default: 'none',
    },
    refundInitiatedAt: { type: Date },
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
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'refunded'],
      default: 'pending',
    },

    reportUrls:        { type: [ReportUrlSchema], default: [] },
    prescription:      { type: PrescriptionSchema, default: undefined },
    payment:           { type: ConsultPaymentSchema, default: undefined },
    reminderSent:      { type: Boolean, default: false },
    cancelledAt:       { type: Date },
    cancellationReason:{ type: String, default: '' },

    // On-behalf booking (admin/staff placed this for the user; awaiting payment link)
    bookedByAdmin: { type: Boolean, default: false },
    paymentLink:   {
      linkId:    { type: String, default: '' },
      url:       { type: String, default: '' },
      expiresAt: { type: Date },
    },
    // Idempotency key — the PendingConsultBooking hold this appointment was created from.
    // Sparse-unique so exactly ONE appointment can ever be created per hold (safe against
    // concurrent/duplicate payment webhooks).
    sourceHoldId: { type: String },

    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

ConsultationAppointmentSchema.index({ doctorSlug: 1 });
ConsultationAppointmentSchema.index({ userId: 1 });
// Exactly one appointment per source hold (sparse: only enforced when the field is set)
ConsultationAppointmentSchema.index({ sourceHoldId: 1 }, { unique: true, sparse: true });
ConsultationAppointmentSchema.index({ appointmentDate: 1, status: 1 });
ConsultationAppointmentSchema.index({ appointmentDateTime: 1, reminderSent: 1, status: 1 });

const ConsultationAppointment: Model<ConsultationAppointmentDocument> =
  (mongoose.models.ConsultationAppointment as Model<ConsultationAppointmentDocument>) ||
  mongoose.model<ConsultationAppointmentDocument>(
    'ConsultationAppointment',
    ConsultationAppointmentSchema
  );

export default ConsultationAppointment;
