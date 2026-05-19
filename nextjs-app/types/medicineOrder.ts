import { z } from 'zod';

// ─── MedicineOrder Status ──────────────────────────────────────────────────────

export type MedicineOrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'prescription_required'
  | 'prescription_verified'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export const ORDER_STATUS_LABELS: Record<MedicineOrderStatus, string> = {
  pending_payment: 'Pending Payment',
  payment_failed: 'Payment Failed',
  confirmed: 'Order Confirmed',
  prescription_required: 'Prescription Required',
  prescription_verified: 'Prescription Verified',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

// ─── Order Item ────────────────────────────────────────────────────────────────

export interface MedicineOrderItem {
  medicineId: string;
  slug: string;
  name: string;
  type: string;
  mrp: number;
  offerPrice: number;
  discountPercentage: number;
  quantity: number;
  thumbnail?: { url: string; publicId: string };
  prescriptionRequired: boolean;
  packSize?: string;
}

// ─── Shipping Address ──────────────────────────────────────────────────────────

export interface ShippingAddress {
  fullName: string;
  mobile: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

// ─── Prescription ──────────────────────────────────────────────────────────────

export interface Prescription {
  url: string;
  publicId: string;
  uploadedAt: string;
}

// ─── Payment ───────────────────────────────────────────────────────────────────

export interface MedicineOrderPayment {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt?: string;
}

// ─── Main Order Interface ──────────────────────────────────────────────────────

export interface MedicineOrder {
  _id: string;
  orderId: string;
  userId: string;
  items: MedicineOrderItem[];
  shippingAddress: ShippingAddress;
  payment: MedicineOrderPayment;
  status: MedicineOrderStatus;
  prescriptions: Prescription[];
  requiresPrescription: boolean;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Checkout Form Schema ──────────────────────────────────────────────────────

export const checkoutAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  mobile: z.string().min(10, 'Valid mobile number required').max(15),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Enter a valid 6-digit pincode'),
  landmark: z.string().optional().default(''),
});

export type CheckoutAddressValues = z.infer<typeof checkoutAddressSchema>;

// ─── Uploaded Prescription (from PrescriptionUpload component) ─────────────────

export interface UploadedPrescription {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
}

// ─── Medicine Cart Item (for CartProvider extension) ───────────────────────────

export interface MedicineCartItem {
  medicineId: string;
  slug: string;
  name: string;
  type: string;
  mrp: number;
  offerPrice: number;
  discountPercentage: number;
  quantity: number;
  thumbnail?: { url: string; publicId: string };
  prescriptionRequired: boolean;
  packSize?: string;
  inStock: boolean;
}
