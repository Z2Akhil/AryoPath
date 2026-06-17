'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Package, MapPin, ArrowLeft, ExternalLink,
  Truck, Loader2, AlertCircle, FileText, Upload, Printer, X, RotateCcw,
} from 'lucide-react';
import medicineOrderApi from '@/lib/api/medicineOrderApi';
import { MedicineOrder, UploadedPrescription } from '@/types/medicineOrder';
import PrescriptionUpload from '@/components/medicines/PrescriptionUpload';
import MedicineOrderReceipt from '@/components/orders/MedicineOrderReceipt';

const MILESTONE_STEPS: { status: MedicineOrder['status']; label: string; icon: React.ReactNode }[] = [
  { status: 'confirmed',          label: 'Confirmed',        icon: <CheckCircle2 className="h-3 w-3" /> },
  { status: 'shipped',            label: 'Shipped',          icon: <Truck className="h-3 w-3" /> },
  { status: 'out_for_delivery',   label: 'Out for Delivery', icon: <MapPin className="h-3 w-3" /> },
  { status: 'delivered',          label: 'Delivered',        icon: <CheckCircle2 className="h-3 w-3" /> },
];

const STATUS_RANK: Record<string, number> = {
  confirmed: 1, prescription_required: 1, prescription_verified: 1,
  shipped: 2, out_for_delivery: 3, delivered: 4,
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

  // Cancel / Return state
  const [confirmCancel, setConfirmCancel]   = useState(false);
  const [cancelling, setCancelling]         = useState(false);
  const [cancelReason, setCancelReason]     = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const [confirmReturn, setConfirmReturn]   = useState(false);
  const [returnReason, setReturnReason]     = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [refundType, setRefundType]         = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId]                   = useState('');
  const [accountNumber, setAccountNumber]   = useState('');
  const [ifsc, setIfsc]                     = useState('');
  const [accountName, setAccountName]       = useState('');

  const handleCancelOrder = async () => {
    const finalReason = (cancelReason === 'Other' ? cancelReasonOther.trim() : cancelReason).trim();
    if (!finalReason) { alert('Please select a reason for cancellation'); return; }
    setCancelling(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    try {
      const res = await fetch(`/api/orders/medicine/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason: finalReason }),
      }).then(r => r.json());
      if (res.success) {
        const updated = await medicineOrderApi.getByOrderId(orderId);
        if (updated.success) setOrder(updated.data);
        setConfirmCancel(false);
        setCancelReason('');
        setCancelReasonOther('');
      } else {
        alert(res.error || 'Failed to cancel order');
      }
    } catch { alert('Failed to cancel order'); }
    finally { setCancelling(false); }
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) return;
    const isCod = order?.payment?.method === 'cod' || (order?.payment as any)?.status === 'cod_pending';
    if (isCod && refundType === 'upi' && !upiId.trim()) { alert('Enter your UPI ID'); return; }
    if (isCod && refundType === 'bank' && (!accountNumber.trim() || !ifsc.trim() || !accountName.trim())) { alert('Fill all bank details'); return; }
    setSubmittingReturn(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const refundDetails = isCod
      ? refundType === 'upi'
        ? { type: 'upi', upiId: upiId.trim() }
        : { type: 'bank', accountNumber: accountNumber.trim(), ifsc: ifsc.trim().toUpperCase(), accountName: accountName.trim() }
      : undefined;
    try {
      const res = await fetch(`/api/orders/medicine/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason: returnReason, ...(refundDetails ? { refundDetails } : {}) }),
      }).then(r => r.json());
      if (res.success) {
        const updated = await medicineOrderApi.getByOrderId(orderId);
        if (updated.success) setOrder(updated.data);
        setConfirmReturn(false);
        setReturnReason('');
      } else {
        alert(res.error || 'Failed to submit return request');
      }
    } catch { alert('Failed to submit return request'); }
    finally { setSubmittingReturn(false); }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await medicineOrderApi.getByOrderId(orderId);
        if (res.success) {
          setOrder(res.data);
          // If AWB exists, refresh tracking from Delhivery in the background —
          // this updates courier status + auto-marks delivered if Delhivery says so
          if ((res.data as any).awb) {
            medicineOrderApi.getTracking(orderId)
              .then(async () => {
                const updated = await medicineOrderApi.getByOrderId(orderId);
                if (updated.success) setOrder(updated.data);
              })
              .catch(() => {/* silent — tracking refresh is best-effort */});
          }
          // If refund is pending/initiated, check Cashfree for latest status
          const rs = (res.data as any).payment?.refundStatus;
          if (rs === 'initiated' || rs === 'pending') {
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            fetch(`/api/orders/medicine/${orderId}/check-refund`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
              .then(r => r.json())
              .then(async d => {
                if (d.success && d.refundStatus !== rs) {
                  const updated = await medicineOrderApi.getByOrderId(orderId);
                  if (updated.success) setOrder(updated.data);
                }
              })
              .catch(() => {});
          }
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

            {/* Pricing breakdown */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(0)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Discount</span>
                  <span>−₹{order.totalDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className={order.deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge.toFixed(0)}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-gray-900 pt-1 border-t border-gray-100">
                <span>Grand Total</span>
                <span className="text-teal-700">₹{order.grandTotal.toFixed(0)}</span>
              </div>
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

          {/* Refund status */}
          {(() => {
            const rs = (order as any).payment?.refundStatus;
            const amt = `₹${Number((order as any).payment?.refundAmount ?? 0).toLocaleString('en-IN')}`;
            if (!rs || rs === 'none') return null;
            if (rs === 'processed') return (
              <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                Refund of {amt} has been processed ✓
              </div>
            );
            if (rs === 'failed') return (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                Refund failed — please contact support at 9973956949
              </div>
            );
            return (
              <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                Refund of {amt} initiated — credit within 5–7 business days
              </div>
            );
          })()}

          {/* Cancel order — pre-shipment always; shipped only while courier hasn't picked it up yet */}
          {(() => {
            const cs = ((order as any).courierStatus ?? '').toLowerCase().trim();
            const notYetPicked = cs === '' || cs === 'manifested';
            return ['confirmed','prescription_required','prescription_verified'].includes(order.status)
              || (order.status === 'shipped' && notYetPicked);
          })() && (
            <div className="mt-3">
              {confirmCancel ? (
                <div className="border border-red-100 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Why are you cancelling this order?</p>
                  <select
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                  >
                    <option value="" disabled>Select a reason…</option>
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                    <option value="Delivery is taking too long">Delivery is taking too long</option>
                    <option value="No longer need the item">No longer need the item</option>
                    <option value="Wrong item / quantity selected">Wrong item / quantity selected</option>
                    <option value="Other">Other</option>
                  </select>
                  {cancelReason === 'Other' && (
                    <textarea
                      value={cancelReasonOther}
                      onChange={e => setCancelReasonOther(e.target.value)}
                      placeholder="Tell us the reason…"
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                  )}
                  <p className="text-xs text-gray-500">A refund will be initiated if you paid online.</p>
                  <div className="flex gap-2">
                    <button onClick={handleCancelOrder} disabled={cancelling} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                      {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Yes, Cancel
                    </button>
                    <button onClick={() => { setConfirmCancel(false); setCancelReason(''); setCancelReasonOther(''); }} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">Keep Order</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmCancel(true)} className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                  <X className="h-3.5 w-3.5" /> Cancel Order
                </button>
              )}
            </div>
          )}

          {/* Return request */}
          {order.status === 'delivered' && !(order as any).returnRequest &&
            (order as any).deliveredAt &&
            (Date.now() - new Date((order as any).deliveredAt).getTime()) / (1000*60*60*24) <= 7 && (
            <div className="mt-3">
              {confirmReturn ? (
                <div className="border border-orange-100 rounded-xl p-3 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Tell us why you want to return:</p>
                  <textarea
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    placeholder="Describe the reason for return..."
                    rows={3}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />

                  {/* COD refund details */}
                  {(order.payment?.method === 'cod' || (order.payment as any)?.status === 'cod_pending') && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-gray-700">Refund to:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundType('upi')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${refundType === 'upi' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600'}`}
                        >UPI</button>
                        <button
                          type="button"
                          onClick={() => setRefundType('bank')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${refundType === 'bank' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600'}`}
                        >Bank Account</button>
                      </div>
                      {refundType === 'upi' ? (
                        <input
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          placeholder="yourname@upi"
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                      ) : (
                        <div className="space-y-1.5">
                          <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Account holder name"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account number"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                          <input value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="IFSC code"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 font-mono" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={handleReturnRequest} disabled={submittingReturn || !returnReason.trim()} className="flex-1 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                      {submittingReturn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Submit Return
                    </button>
                    <button onClick={() => setConfirmReturn(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmReturn(true)} className="w-full py-2.5 border border-orange-200 text-orange-600 text-sm font-bold rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Return Order
                </button>
              )}
            </div>
          )}

          {/* Return status */}
          {(order as any).returnRequest && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
              <p className="text-xs font-bold text-orange-700 mb-0.5">Return Request — {(order as any).returnRequest.status}</p>
              <p className="text-xs text-orange-600">{(order as any).returnRequest.reason}</p>
            </div>
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
              {order.shippingAddress.email && <p>{order.shippingAddress.email}</p>}
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
