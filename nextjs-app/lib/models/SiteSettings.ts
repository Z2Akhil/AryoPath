import mongoose, { Schema, Document, Model } from 'mongoose';
import { SiteSettings as SiteSettingsType } from '@/types';
import Admin from './Admin';


export interface SiteSettingsDocument extends Omit<SiteSettingsType, '_id'>, Document { }

const siteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    logo: {
      type: String,
      default: '/assets/default-logo.png',
    },
    logoPublicId: {
      type: String,
      default: '',
    },
    heroImage: {
      type: String,
      default: '',
    },
    heroImagePublicId: {
      type: String,
      default: '',
    },
    helplineNumber: {
      type: String,
      default: '+91-00000-00000',
    },
    email: {
      type: String,
      default: 'support@example.com',
    },
    socialMedia: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    medicineCourierCharge: {
      type: Number,
      default: 49,
      min: 0,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

const SiteSettings = (mongoose.models.SiteSettings as Model<SiteSettingsDocument>) || mongoose.model<SiteSettingsDocument>('SiteSettings', siteSettingsSchema);

export default SiteSettings;