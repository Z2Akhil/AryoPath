import mongoose, { Schema, Document } from 'mongoose';
import './User';
import './Doctor';

// A temporary slot reservation for an on-behalf consultation awaiting payment.
// It HOLDS the doctor's slot (booked-slots counts active holds) but is NOT a real
// appointment. On payment (webhook) → a ConsultationAppointment is created from this
// data and the hold is deleted. On expiry/failure → the hold is deleted, freeing the slot.
// A TTL index auto-deletes holds at `expiresAt` (48h) as a safety net.

export interface IPendingConsultBooking extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  doctorSlug: string;
  doctorName: string;
  doctorMobile: string;
  patientName: string;
  patientMobile: string;
  patientEmail?: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  symptoms?: string;
  consultationMode: 'video' | 'audio';
  appointmentDate: string;
  appointmentTime: string;
  appointmentDateTime: Date;
  consultationFee: number;
  finalAmount: number;
  paymentLink?: { linkId?: string; url?: string; expiresAt?: Date };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingConsultBookingSchema = new Schema<IPendingConsultBooking>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorSlug:   { type: String, required: true },
    doctorName:   { type: String, required: true },
    doctorMobile: { type: String, default: '' },
    patientName:   { type: String, required: true, trim: true },
    patientMobile: { type: String, required: true },
    patientEmail:  { type: String, default: '' },
    patientAge:    { type: Number, required: true },
    patientGender: { type: String, enum: ['male', 'female', 'other'], required: true },
    symptoms:      { type: String, default: '' },
    consultationMode: { type: String, enum: ['video', 'audio'], required: true },
    appointmentDate:  { type: String, required: true },
    appointmentTime:  { type: String, required: true },
    appointmentDateTime: { type: Date, required: true },
    consultationFee: { type: Number, required: true },
    finalAmount:     { type: Number, required: true },
    paymentLink: {
      linkId:    { type: String, default: '' },
      url:       { type: String, default: '' },
      expiresAt: { type: Date },
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Fast slot-conflict lookup (booked-slots + clash check)
PendingConsultBookingSchema.index({ doctorSlug: 1, appointmentDate: 1 });
PendingConsultBookingSchema.index({ 'paymentLink.linkId': 1 });
// TTL: auto-delete the hold when it expires (releases the slot)
PendingConsultBookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.PendingConsultBooking ||
  mongoose.model<IPendingConsultBooking>('PendingConsultBooking', PendingConsultBookingSchema);
