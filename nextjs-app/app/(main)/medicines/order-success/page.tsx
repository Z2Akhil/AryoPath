'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, Truck, MapPin, ShoppingBag, ArrowRight, Loader2,
  Calendar, Receipt,
} from 'lucide-react';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import { MedicineOrder, ORDER_STATUS_LABELS } from '@/types/medicineOrder';

const TRACKING_STEPS: { status: MedicineOrder['status']; label: string }[] = [
  { status: 'confirmed',              label: 'Order Confirmed' },
  { status: 'prescription_verified', label: 'Prescription Verified' },
  { status: 'packed',                label: 'Packed' },
  { status: 'shipped',               label: 'Shipped' },
  { status: 'out_for_delivery',      label: 'Out for Delivery' },
  { status: 'delivered',             label: 'Delivered' },
];

const STATUS_ORDER: MedicineOrder['status'][] = [
  'pending_payment', 'payment_failed', 'confirmed', 'prescription_required',
  'prescription_verified', 'packed', 'shipped', 'out_for_delivery', 'delivered',
  'cancelled', 'refunded',
];

function getStepIndex(status: MedicineOrder['status']) {
  return TRACKING_STEPS.findIndex(s => s.status === status);
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<MedicineOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await medicineOrderApi.getByOrderId(orderId);
        if (res.success) setOrder(res.data);
      } catch { /* show generic success */ }
      finally { setLoading(false); }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const currentStep = order ? getStepIndex(order.status) : -1;
  const estimatedDate = order?.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Order Placed Successfully!</h1>
          <p className="text-gray-500 text-sm">
            Thank you for your order. We'll notify you when it ships.
          </p>
        </div>

        {/* Order ID card */}
        {(order || orderId) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                <p className="text-lg font-extrabold text-teal-700">{order?.orderId || orderId}</p>
              </div>
              {order?.createdAt && (
                <div className="text-right">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Placed on</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {estimatedDate && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
                <Calendar className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-teal-700">
                  Estimated Delivery: <span className="font-extrabold">{estimatedDate}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tracking timeline */}
        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Truck className="h-5 w-5 text-teal-600" />
              <h2 className="text-sm font-extrabold text-gray-900">Order Tracking</h2>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-5">
                {TRACKING_STEPS.map((step, idx) => {
                  const isDone    = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={step.status} className="flex items-center gap-4 relative">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                        isDone
                          ? 'bg-teal-500 border-teal-500'
                          : isCurrent
                          ? 'bg-white border-teal-300'
                          : 'bg-white border-gray-200'
                      }`}>
                        {isDone && <CheckCircle2 className="h-4 w-4 text-white" />}
                        {!isDone && <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-teal-400' : 'bg-gray-200'}`} />}
                      </div>
                      <p className={`text-sm ${isDone ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Items ordered */}
        {order && order.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-extrabold text-gray-900">Items Ordered</h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} · ₹{item.offerPrice} each</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">₹{(item.offerPrice * item.quantity).toFixed(0)}</p>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-gray-900">
                <span>Grand Total</span>
                <span className="text-teal-700">₹{order.grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery address */}
        {order?.shippingAddress && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-extrabold text-gray-900">Delivery Address</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-bold text-gray-800">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
              <p>📞 {order.shippingAddress.mobile}</p>
            </div>
          </div>
        )}

        {/* Payment info */}
        {order?.payment && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-5 w-5 text-gray-600" />
              <h2 className="text-sm font-extrabold text-gray-900">Payment</h2>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-bold ${order.payment.status === 'paid' ? 'text-green-600' : 'text-gray-700'}`}>
                {order.payment.status === 'paid' ? '✓ Paid' : order.payment.status}
              </span>
            </div>
            {order.payment.cfPaymentId && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono text-xs text-gray-600">{order.payment.cfPaymentId}</span>
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/medicines"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl transition-colors text-sm shadow-lg shadow-teal-200"
          >
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
          {(order?.orderId || orderId) && (
            <Link
              href={`/medicines/orders/${order?.orderId || orderId}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors text-sm"
            >
              <Truck className="h-4 w-4" /> Track Order <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
