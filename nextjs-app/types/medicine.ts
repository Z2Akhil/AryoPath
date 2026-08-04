import { z } from 'zod';

// ─── Static option lists ─────────────────────────────────────────────────────

export const MEDICINE_TYPES = [
  'tablet', 'capsule', 'syrup', 'injection', 'inhaler', 'spray',
  'cream', 'ointment', 'gel', 'lotion', 'semi-liquid',
  'drops', 'powder',
] as const;

export type MedicineType = (typeof MEDICINE_TYPES)[number];

export const MEDICINE_CATEGORIES = [
  'Pain Relief', 'Antibiotics', 'Vitamins & Supplements',
  'Diabetes Care', 'Heart Care', 'Blood Pressure', 'Hypertension',
  'Kidney Care', 'Asthma', 'Infection', 'Stomach & Digestive', 'Skin Care',
  "Cold, Cough & Flu", 'Allergy', 'Ayurvedic', 'Homeopathic',
  "Women's Health", "Men's Health", 'Baby & Mother Care',
  'Mental Health', 'Neurology', 'Thyroid Care', 'Eye Care', 'Dental Care',
  'Food Products & Milk', 'Fitness & Nutrition',
  'Shampoo', 'Soap', 'Handwash', 'Accessories', 'Other',
] as const;

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface MedicineImage {
  url: string;
  publicId: string;
}

export interface MedicineFAQ {
  question: string;
  answer: string;
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

export const medicineSchema = z.object({
  // Basic
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  shortDescription: z.string().optional().default(''),
  fullDescription: z.string().optional().default(''),
  type: z.enum(MEDICINE_TYPES),
  category: z.string().optional().default(''),
  tags: z.array(z.string()).default([]),

  // Pricing
  mrp: z.coerce.number().min(0.01, 'MRP must be greater than 0'),
  offerPrice: z.coerce.number().min(0, 'Offer price cannot be negative'),
  pricePerUnit: z.coerce.number().optional(),
  packSize: z.string().optional().default(''),
  tabletCount: z.coerce.number().optional(),
  weightVolume: z.string().optional().default(''),

  // Manufacturer
  madeBy: z.string().optional().default(''),
  marketedBy: z.string().optional().default(''),
  countryOfOrigin: z.string().optional().default('India'),

  // Medical
  saltComposition: z.string().optional().default(''),
  uses: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  howItWorks: z.string().optional().default(''),
  dosage: z.string().optional().default(''),
  sideEffects: z.array(z.string()).default([]),
  precautions: z.array(z.string()).default([]),
  storageInstructions: z.string().optional().default(''),
  drugInteractions: z.string().optional().default(''),

  // Safety warnings
  pregnancyWarning: z.string().optional().default(''),
  breastfeedingWarning: z.string().optional().default(''),
  alcoholWarning: z.string().optional().default(''),
  drivingWarning: z.string().optional().default(''),
  kidneyWarning: z.string().optional().default(''),
  liverWarning: z.string().optional().default(''),

  // Prescription
  prescriptionRequired: z.boolean().default(false),
  uploadPrescriptionRequired: z.boolean().default(false),

  // Inventory
  expiryDate: z.string().optional().default(''),
  stockQuantity: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  inStock: z.boolean().default(true),
  lowStockThreshold: z.coerce.number().min(0).default(10),
  sku: z.string().optional().default(''),
  batchNumber: z.string().optional().default(''),

  // FAQ
  faqs: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .default([]),

  // SEO
  metaTitle: z.string().optional().default(''),
  metaDescription: z.string().optional().default(''),
  searchKeywords: z.string().optional().default(''),
  seoTags: z.array(z.string()).default([]),

  // Status
  isPublished: z.boolean().default(false),
  isDraft: z.boolean().default(true),
}).refine((d) => d.offerPrice <= d.mrp, {
  message: 'Offer price must be ≤ MRP',
  path: ['offerPrice'],
});

export type MedicineFormValues = z.infer<typeof medicineSchema>;

// ─── Full medicine document (from DB) ────────────────────────────────────────

export interface Medicine extends MedicineFormValues {
  _id: string;
  images: MedicineImage[];
  thumbnail?: MedicineImage;
  discountPercentage: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Default form values ──────────────────────────────────────────────────────

export const medicinDefaultValues: MedicineFormValues = {
  name: '', slug: '', shortDescription: '', fullDescription: '',
  type: 'tablet', category: '', tags: [],
  mrp: 0, offerPrice: 0, pricePerUnit: undefined,
  packSize: '', tabletCount: undefined, weightVolume: '',
  madeBy: '', marketedBy: '', countryOfOrigin: 'India',
  saltComposition: '', uses: [], benefits: [], howItWorks: '',
  dosage: '', sideEffects: [], precautions: [],
  storageInstructions: '', drugInteractions: '',
  pregnancyWarning: '', breastfeedingWarning: '',
  alcoholWarning: '', drivingWarning: '',
  kidneyWarning: '', liverWarning: '',
  prescriptionRequired: false, uploadPrescriptionRequired: false,
  expiryDate: '', stockQuantity: 0, inStock: true,
  lowStockThreshold: 10, sku: '', batchNumber: '',
  faqs: [], metaTitle: '', metaDescription: '',
  searchKeywords: '', seoTags: [],
  isPublished: false, isDraft: true,
};
