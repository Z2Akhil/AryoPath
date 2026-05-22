'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, MapPin, Phone, User, AlertTriangle, FileText, Truck, Tag, Lock } from 'lucide-react';
import { useCart } from '@/providers/CartProvider';
import { useSiteSettings } from '@/providers/SiteSettingsProvider';
import { useToast } from '@/providers/ToastProvider';
import { checkoutAddressSchema, CheckoutAddressValues, UploadedPrescription as PrescriptionType } from '@/types/medicineOrder';
import PrescriptionUpload from './PrescriptionUpload';
import medicineOrderApi from '@/lib/api/medicineOrderApi';

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load payment gateway'));
    document.body.appendChild(script);
  });
}

const field = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
  'Puducherry','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Lakshadweep','Andaman & Nicobar',
];

export default function MedicineCheckoutForm() {
  const router = useRouter();
  const { medicineCart, clearMedicineCart } = useCart();
  const { settings } = useSiteSettings();
  const toast = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionType[]>([]);
  const [processing, setProcessing] = useState(false);

  const medicineItems = medicineCart;

  const subtotal       = medicineItems.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const totalDiscount  = medicineItems.reduce((s, i) => s + (i.mrp - i.offerPrice) * i.quantity, 0);
  const totalAmount    = medicineItems.reduce((s, i) => s + i.offerPrice * i.quantity, 0);
  const courierCharge  = settings?.medicineCourierCharge ?? 49;
  const deliveryCharge = totalAmount >= 1000 ? 0 : courierCharge;
  const grandTotal     = totalAmount + deliveryCharge;

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutAddressValues>({
    resolver: zodResolver(checkoutAddressSchema) as any,
  });

  const onSubmit = async (addressData: CheckoutAddressValues) => {
    if (medicineItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create medicine order (pending_payment)
      const orderPayload = {
        items: medicineItems.map(i => ({
          slug: i.slug,
          name: i.name,
          mrp: i.mrp,
          offerPrice: i.offerPrice,
          quantity: i.quantity,
        })),
        shippingAddress: addressData,
        grandTotal,
        prescriptions: prescriptions.map(p => ({ url: p.url, publicId: p.publicId })),
      };

      const orderRes = await medicineOrderApi.createOrder(orderPayload);
      if (!orderRes.success) throw new Error('Failed to create order. Please try again.');

      const medicineOrderId = orderRes.data._id;
      const internalOrderId = orderRes.data.orderId;

      // Step 2: Create Razorpay order
      const rzpRes = await medicineOrderApi.createRazorpayOrder(grandTotal, `rcpt_${internalOrderId}`);
      if (!rzpRes.success) throw new Error('Payment initialization failed. Please try again.');

      const { orderId: rzpOrderId, amount: rzpAmount, currency, keyId } = rzpRes.data;

      // Step 3: Load Razorpay script
      await loadRazorpay();

      // Step 4: Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          amount: rzpAmount,
          currency,
          name: 'AyroPath',
          description: 'Medicine Order',
          order_id: rzpOrderId,
          handler: async (response: any) => {
            try {
              // Step 5: Verify payment
              const verifyRes = await medicineOrderApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                medicineOrderId,
              });
              if (!verifyRes.success) throw new Error('Payment verification failed');
              clearMedicineCart();
              toast.success('Order placed successfully!');
              router.push(`/medicines/order-success?orderId=${internalOrderId}`);
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              toast.error('Payment cancelled. Your order has not been placed.');
              reject(new Error('cancelled'));
            },
          },
          prefill: {
            name: addressData.fullName,
            contact: addressData.mobile,
          },
          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: false,
            paylater: false,
            emi: false,
          },
          theme: { color: '#0f766e' },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', () => {
          setProcessing(false);
          toast.error('Payment failed. Please try again.');
          reject(new Error('failed'));
        });
        rzp.open();
      });
    } catch (error: any) {
      if (error.message !== 'cancelled' && error.message !== 'failed') {
        toast.error(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Delivery Address */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="h-5 w-5 text-teal-600" />
          <h2 className="text-base font-extrabold text-gray-900">Delivery Address</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register('fullName')} placeholder="Akhil Kumar" className={`${field} pl-10`} />
            </div>
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input {...register('mobile')} type="tel" placeholder="+91 98765 43210" className={`${field} pl-10`} />
            </div>
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input {...register('addressLine1')} placeholder="House no., Building, Street..." className={field} />
            {errors.addressLine1 && <p className="text-xs text-red-500 mt-1">{errors.addressLine1.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Address Line 2
            </label>
            <input {...register('addressLine2')} placeholder="Area, Locality, Colony (optional)" className={field} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Landmark
            </label>
            <input {...register('landmark')} placeholder="Near landmark (optional)" className={field} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input {...register('pincode')} placeholder="110001" maxLength={6} className={field} />
            {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input {...register('city')} placeholder="New Delhi" className={field} />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              State <span className="text-red-500">*</span>
            </label>
            <select {...register('state')} className={field}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>
        </div>
      </div>

      {/* Prescription Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-extrabold text-gray-900">Prescription</h2>
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
            Required for Rx medicines
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Upload a valid prescription from a registered medical practitioner. Accepted formats: JPG, PNG, PDF (max 10MB each).
        </p>
        <PrescriptionUpload value={prescriptions} onChange={setPrescriptions} />
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-extrabold text-gray-900 mb-4">Order Summary</h2>

        <div className="space-y-2 mb-4">
          {medicineItems.map(item => (
            <div key={item.slug} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">{item.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-gray-900 flex-shrink-0">₹{(item.offerPrice * item.quantity).toFixed(0)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal (MRP)</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Discount</span>
              <span>-₹{totalDiscount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Delivery</span>
            <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </span>
          </div>
          {deliveryCharge > 0 && (
            <p className="text-xs text-gray-400">Free delivery on orders above ₹1,000</p>
          )}
          <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-teal-700">₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Warning for Rx */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-amber-700">
          Orders containing prescription medicines will be verified before dispatch. Delivery may be delayed if prescription is invalid.
        </p>
      </div>

      {/* Pay Now button */}
      <button
        type="submit"
        disabled={processing || medicineItems.length === 0}
        className="w-full flex items-center justify-center gap-3 py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200"
      >
        {processing
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
          : <><CreditCard className="h-5 w-5" /> Pay ₹{grandTotal.toFixed(0)} · Secure Checkout</>
        }
      </button>
      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" /> Secured by Razorpay · UPI, Cards, NetBanking accepted
      </p>
    </form>
  );
}
