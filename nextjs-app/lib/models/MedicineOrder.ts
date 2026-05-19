import mongoose, { Schema, Document, Model } from 'mongoose';
import type { MedicineOrder, MedicineOrderStatus } from '@/types/medicineOrder';

export interface MedicineOrderDocument extends Omit<MedicineOrder, '_id'>, Document {}

const OrderItemSchema = new Schema(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: '' },
    mrp: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    prescriptionRequired: { type: Boolean, default: false },
    packSize: { type: String, default: '' },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String, default: '' },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: { type: Date },
  },
  { _id: false }
);

const STATUS_VALUES: MedicineOrderStatus[] = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'prescription_required',
  'prescription_verified',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
];

const MedicineOrderSchema = new Schema<MedicineOrderDocument>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    payment: { type: PaymentSchema, required: true },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'pending_payment',
    },
    prescriptions: { type: [PrescriptionSchema], default: [] },
    requiresPrescription: { type: Boolean, default: false },
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

MedicineOrderSchema.index({ userId: 1, createdAt: -1 });
MedicineOrderSchema.index({ orderId: 1 });
MedicineOrderSchema.index({ status: 1 });
MedicineOrderSchema.index({ 'payment.razorpayOrderId': 1 });

const MedicineOrder =
  (mongoose.models.MedicineOrder as Model<MedicineOrderDocument>) ||
  mongoose.model<MedicineOrderDocument>('MedicineOrder', MedicineOrderSchema);

export default MedicineOrder;
