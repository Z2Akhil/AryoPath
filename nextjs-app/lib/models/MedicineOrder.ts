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
    email: { type: String, default: '' },
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

const CourierEventSchema = new Schema(
  {
    status:     { type: String, required: true },
    statusType: { type: String, default: '' },
    activity:   { type: String, default: '' },
    location:   { type: String, default: '' },
    timestamp:  { type: Date, required: true },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    cfOrderId:   { type: String, default: '' },
    cfPaymentId: { type: String, default: '' },
    amount:   { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: { type: Date },
    refundId:          { type: String, default: '' },
    refundAmount:      { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['none', 'initiated', 'pending', 'processed', 'failed'],
      default: 'none',
    },
    refundInitiatedAt: { type: Date },
    refundCompletedAt: { type: Date },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema(
  {
    requestedAt: { type: Date },
    reason:      { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'received'],
      default: 'pending',
    },
    approvedAt:  { type: Date },
    receivedAt:  { type: Date },
    adminNotes:  { type: String, default: '' },
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
  'return_requested',
  'return_received',
];

const MedicineOrderSchema = new Schema<MedicineOrderDocument>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    payment: { type: PaymentSchema, default: () => ({}) },
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
    returnRequest: { type: ReturnRequestSchema },
    returnAwb:              { type: String, default: '' },
    awb:                    { type: String, default: '' },
    courierPartner:         { type: String, default: '' },
    trackingUrl:            { type: String, default: '' },
    courierStatus:          { type: String, default: '' },
    courierStatusUpdatedAt: { type: Date },
    courierStatusHistory:   { type: [CourierEventSchema], default: [] },
    // TTL: pending_payment / payment_failed orders auto-delete after 30 min
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MedicineOrderSchema.index({ userId: 1, createdAt: -1 });
MedicineOrderSchema.index({ status: 1 });
MedicineOrderSchema.index({ awb: 1 }, { sparse: true });
// TTL index — deletes doc when expiresAt is reached; sparse so confirmed orders (expiresAt=null) are ignored
MedicineOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const MedicineOrder =
  (mongoose.models.MedicineOrder as Model<MedicineOrderDocument>) ||
  mongoose.model<MedicineOrderDocument>('MedicineOrder', MedicineOrderSchema);

export default MedicineOrder;
