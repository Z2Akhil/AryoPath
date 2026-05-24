'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, MapPin, ArrowLeft, ExternalLink,
  Truck, Loader2, AlertCircle, FileText, Upload, Printer,
} from 'lucide-react';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import { MedicineOrder, UploadedPrescription } from '@/types/medicineOrder';
import PrescriptionUpload from '@/components/medicines/PrescriptionUpload';
import MedicineOrderReceipt from '@/components/orders/MedicineOrderReceipt';

const MILESTONE_STEPS: { status: MedicineOrder['status']; label: string; icon: React.ReactNode }[] = [
  { status: 'confirmed',          label: 'Confirmed',        icon: <CheckCircle2 className="h-3 w-3" /> },
  { status: 'packed',             label: 'Packed',           icon: <Package className="h-3 w-3" /> },
  { status: 'shipped',            label: 'Shipped',          icon: <Truck className="h-3 w-3" /> },
  { status: 'out_for_delivery',   label: 'Out for Delivery', icon: <MapPin className="h-3 w-3" /> },
  { status: 'delivered',          label: 'Delivered',        icon: <CheckCircle2 className="h-3 w-3" /> },
];

const STATUS_RANK: Record<string, number> = {
  confirmed: 1, prescription_required: 1, prescription_verified: 1,
  packed: 2, shipped: 3, out_for_delivery: 4, delivered: 5,
};

function getMilestoneIndex(status: string): number {
  const rank = STATUS_RANK[status] ?? 0;
  for (let i = MILESTONE_STEPS.length - 1; i >= 0; i--) {
    if ((STATUS_RANK[MILESTONE_STEPS[i].status] ?? 0) <= rank) return i;
  }
  return -1;
}

export default function MedicineOrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder]     = useState<MedicineOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Prescription upload state (shown when status is prescription_required)
  const [newPrescriptions, setNewPrescriptions] = useState<UploadedPrescription[]>([]);
  const [submittingRx, setSubmittingRx]         = useState(false);
  const [rxSubmitted, setRxSubmitted]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await medicineOrderApi.getByOrderId(orderId);
        if (res.success) {
          setOrder(res.data);
        } else {
          setError('Order not found.');
        }
      } catch {
        setError('Failed to load order.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handleSubmitPrescription = async () => {
    if (newPrescriptions.length === 0) return;
    setSubmittingRx(true);
    try {
      const res = await medicineOrderApi.addPrescription(
        orderId,
        newPrescriptions.map(p => ({ url: p.url, publicId: p.publicId }))
      );
      if (res.success) {
        setRxSubmitted(true);
        setNewPrescriptions([]);
        // Refresh order data to show newly uploaded prescriptions
        const updated = await medicineOrderApi.getByOrderId(orderId);
        if (updated.success) setOrder(updated.data);
      }
    } catch { /* silent */ }
    finally { setSubmittingRx(false); }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm">{error || 'Order not found.'}</p>
        <button onClick={() => router.back()} className="text-teal-600 text-sm font-semibold hover:underline">Go Back</button>
      </div>
    );
  }

  const milestoneIdx = getMilestoneIndex(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 print:hidden">

        {/* Back link */}
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-600 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
              <p className="text-lg font-extrabold text-teal-700">{order.orderId}</p>
              <p className="text-xs text-gray-400 mt-1">
                Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {order.awb && (
              <div className="text-right">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">AWB / Tracking</p>
                <p className="text-sm font-bold text-gray-800 font-mono">{order.awb}</p>
                <p className="text-xs text-gray-400">via Delhivery</p>
              </div>
            )}
          </div>

          {order.awb && order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-sm rounded-xl border border-teal-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Track on Delhivery
            </a>
          )}
        </div>

        {/* Milestone progress bar */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-center gap-2 mb-5">
              <Truck className="h-5 w-5 text-teal-600" />
              <h2 className="text-sm font-extrabold text-gray-900">Order Progress</h2>
            </div>

            <div className="relative flex items-start justify-between">
              {/* Track background */}
              <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100 z-0" />
              {/* Track fill */}
              <div
                className="absolute top-3 left-3 h-0.5 bg-teal-400 z-0 transition-all"
                style={{ width: milestoneIdx >= 0 ? `calc(${(milestoneIdx / (MILESTONE_STEPS.length - 1)) * 100}% - 6px)` : '0%' }}
              />
              {MILESTONE_STEPS.map((step, idx) => {
                const isDone    = milestoneIdx >= idx;
                const isCurrent = milestoneIdx === idx;
                return (
                  <div key={step.status} className="flex flex-col items-center z-10 flex-1 first:items-start last:items-end">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isDone    ? 'bg-teal-500 border-teal-500 text-white'
                      : isCurrent ? 'bg-white border-teal-400'
                      : 'bg-white border-gray-200'
                    }`}>
                      {isDone
                        ? step.icon
                        : <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-teal-400' : 'bg-gray-200'}`} />}
                    </div>
                    <p className={`mt-1.5 text-[9px] font-semibold text-center leading-tight max-w-[52px] ${
                      isDone || isCurrent ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-sm">Order {order.status === 'refunded' ? 'Refunded' : 'Cancelled'}</p>
              {order.cancellationReason && <p className="text-xs text-red-500 mt-1">{order.cancellationReason}</p>}
            </div>
          </div>
        )}

        {/* ── Prescription upload banner (shown when Rx required and not yet verified) ── */}
        {order.status === 'prescription_required' && (
          <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-sm p-6 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-orange-800">Prescription Required</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  One or more medicines in this order require a valid prescription from a registered doctor.
                  Upload it below — we'll verify and process your order within a few hours.
                </p>
              </div>
            </div>

            {rxSubmitted ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-700">Prescription submitted!</p>
                  <p className="text-xs text-green-600 mt-0.5">Our team will verify it and update your order shortly.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Already uploaded prescriptions */}
                {order.prescriptions && order.prescriptions.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-green-700">
                      {order.prescriptions.length} prescription{order.prescriptions.length > 1 ? 's' : ''} already uploaded — waiting for verification
                    </p>
                  </div>
                )}

                <PrescriptionUpload value={newPrescriptions} onChange={setNewPrescriptions} />

                {newPrescriptions.length > 0 && (
                  <button
                    onClick={handleSubmitPrescription}
                    disabled={submittingRx}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingRx
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                      : <><Upload className="h-4 w-4" /> Submit Prescription</>
                    }
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
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

          {order.status === 'delivered' && (
            <button
              onClick={() => window.print()}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-teal-700 font-bold text-sm rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Receipt
            </button>
          )}
        </div>

        {/* Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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

      </div>

      <MedicineOrderReceipt order={order} />
    </div>
  );
}
