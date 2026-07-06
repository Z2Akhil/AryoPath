import mongoose, { Schema, Document } from 'mongoose';
import './User';

// Prescription intake record.
// A logged-in user uploads a medicine prescription (up to 5 files) + contact details.
// Staff/admin review it in the Prescription section, call the user to confirm,
// then book a medicine order on their behalf. Lab tests & appointments are NOT
// part of this intake — those are handled via phone call directly.

export interface PrescriptionFile {
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface IPrescription extends Document {
  userId: mongoose.Types.ObjectId;
  files: PrescriptionFile[];
  contactMobile: string;
  contactEmail?: string;
  note?: string;
  status: 'pending' | 'done';
  handledBy?: mongoose.Types.ObjectId;   // admin/staff who marked it done
  handledByModel?: 'Admin' | 'Staff';
  handledAt?: Date;
  createdOrderIds: string[];             // order(s) booked from this Rx (traceability)
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionFileSchema = new Schema<PrescriptionFile>(
  {
    url:        { type: String, required: true },
    publicId:   { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    files:  { type: [PrescriptionFileSchema], required: true },
    contactMobile: { type: String, required: true, trim: true },
    contactEmail:  { type: String, trim: true, lowercase: true },
    note:          { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'done'],
      default: 'pending',
    },
    handledBy:      { type: Schema.Types.ObjectId, refPath: 'handledByModel' },
    handledByModel: { type: String, enum: ['Admin', 'Staff'] },
    handledAt:      { type: Date },
    createdOrderIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Queue: newest pending first; badge count = countDocuments({ status: 'pending' })
PrescriptionSchema.index({ status: 1, createdAt: -1 });
PrescriptionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Prescription ||
  mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
