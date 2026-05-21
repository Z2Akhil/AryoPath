import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Permission } from '@/lib/constants/permissions';

export interface StaffDocument extends Document {
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  mobile: string;
  permissions: Permission[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(password: string): Promise<boolean>;
}

const StaffSchema = new Schema<StaffDocument>(
  {
    username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    mobile:       { type: String, required: true, trim: true },
    permissions:  [{ type: String }],
    isActive:     { type: Boolean, default: true },
    createdBy:    { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    lastLogin:    { type: Date },
  },
  { timestamps: true }
);

StaffSchema.methods.verifyPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

StaffSchema.index({ username: 1 });
StaffSchema.index({ isActive: 1 });

const Staff =
  (mongoose.models.Staff as Model<StaffDocument>) ||
  mongoose.model<StaffDocument>('Staff', StaffSchema);

export default Staff;
