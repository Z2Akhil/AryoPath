import mongoose, { Schema, Document, Model } from 'mongoose';
import { Medicine as MedicineType, MEDICINE_TYPES } from '@/types/medicine';

export interface MedicineDocument extends Omit<MedicineType, '_id'>, Document {}

const ImageSchema = new Schema(
  { url: { type: String, required: true }, publicId: { type: String, required: true } },
  { _id: false }
);

const FAQSchema = new Schema(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false }
);

const MedicineSchema = new Schema<MedicineDocument>(
  {
    // Basic
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    images: { type: [ImageSchema], default: [] },
    thumbnail: { type: ImageSchema, default: null },
    type: {
      type: String,
      enum: [...MEDICINE_TYPES],   // single source of truth — never diverges from the UI list
      required: true,
    },
    category: { type: String, default: '' },
    tags: [{ type: String }],

    // Pricing
    mrp: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0 },
    pricePerUnit: { type: Number },
    packSize: { type: String, default: '' },
    tabletCount: { type: Number },
    weightVolume: { type: String, default: '' },

    // Manufacturer
    madeBy: { type: String, default: '' },
    marketedBy: { type: String, default: '' },
    countryOfOrigin: { type: String, default: 'India' },

    // Medical
    saltComposition: { type: String, default: '' },
    uses: [{ type: String }],
    benefits: [{ type: String }],
    howItWorks: { type: String, default: '' },
    dosage: { type: String, default: '' },
    sideEffects: [{ type: String }],
    precautions: [{ type: String }],
    storageInstructions: { type: String, default: '' },
    drugInteractions: { type: String, default: '' },

    // Safety
    pregnancyWarning: { type: String, default: '' },
    breastfeedingWarning: { type: String, default: '' },
    alcoholWarning: { type: String, default: '' },
    drivingWarning: { type: String, default: '' },
    kidneyWarning: { type: String, default: '' },
    liverWarning: { type: String, default: '' },

    // Prescription
    prescriptionRequired: { type: Boolean, default: false },
    uploadPrescriptionRequired: { type: Boolean, default: false },

    // Inventory
    expiryDate: { type: String, default: '' },
    stockQuantity: { type: Number, default: 0, min: 0 },
    inStock: { type: Boolean, default: true },
    lowStockThreshold: { type: Number, default: 10 },
    sku: { type: String, default: '' },
    batchNumber: { type: String, default: '' },

    // FAQ
    faqs: { type: [FAQSchema], default: [] },

    // SEO
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    searchKeywords: { type: String, default: '' },
    seoTags: [{ type: String }],

    // Status
    isPublished: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: true },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

MedicineSchema.index({ slug: 1 }, { unique: true });
MedicineSchema.index({ name: 'text', saltComposition: 'text', tags: 'text' });
MedicineSchema.index({ type: 1, category: 1, isPublished: 1 });

const Medicine =
  (mongoose.models.Medicine as Model<MedicineDocument>) ||
  mongoose.model<MedicineDocument>('Medicine', MedicineSchema);

export default Medicine;
