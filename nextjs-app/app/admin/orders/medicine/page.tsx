'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Pill, Package, Truck, CheckCircle2,
  AlertTriangle, ChevronLeft, ChevronRight, X, FileText,
  RefreshCw, Loader2, MapPin, Phone, User,
  ClipboardList, ExternalLink, Hash, Download,
  Calendar, Clock, XCircle,
} from 'lucide-react';
import adminMedicineOrderApi from '@/lib/api/adminMedicineOrderApi';
import type { MedicineOrder, MedicineOrderStatus, CourierEvent } from '@/types/medicineOrder';
import { useToast } from '@/providers/ToastProvider';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

type PopulatedOrder = MedicineOrder & {
  userId: { firstName: string; lastName: string; mobileNumber: string; email?: string };
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<MedicineOrderStatus, { label: string; cls: string }> = {
  pending_payment:       { label: 'Pending Payment',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  payment_failed:        { label: 'Payment Failed',   cls: 'bg-red-50 text-red-600 border-red-200' },
  confirmed:             { label: 'Confirmed',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  prescription_required: { label: 'Rx Required',      cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  prescription_verified: { label: 'Rx Verified',      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  packed:                { label: 'Packed',            cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  shipped:               { label: 'Shipped',           cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  out_for_delivery:      { label: 'Out for Delivery', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  delivered:             { label: 'Delivered',         cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:             { label: 'Cancelled',         cls: 'bg-red-50 text-red-600 border-red-200' },
  refunded:              { label: 'Refunded',          cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  return_requested:      { label: 'Return Requested',  cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  return_received:       { label: 'Return Received',   cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'COD – Pending',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  paid:     { label: 'Paid',           cls: 'bg-green-50 text-green-700 border-green-200' },
  failed:   { label: 'Failed',         cls: 'bg-red-50 text-red-600 border-red-200' },
  refunded: { label: 'Refunded',       cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const StatusBadge = ({ status }: { status: MedicineOrderStatus }) => {
  const cfg = STATUS[status] ?? { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{children}</p>
);

// Cloudinary: append fl_attachment to force file download instead of browser preview
const makeDownloadUrl = (url: string) => url.replace('/upload/', '/upload/fl_attachment/');

function ReturnActionPanel({ order, onSave }: { order: any; onSave: (o: any) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [notes, setNotes]     = React.useState('');
  const ret = order.returnRequest;

  const handleAction = async (action: 'approve' | 'reject' | 'received') => {
    setLoading(true);
    try {
      const res = await adminMedicineOrderApi.returnAction(order.orderId, action, notes);
      if (res.success) onSave(res.order);
    } catch { alert('Action failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="border border-orange-200 rounded-xl p-3 mt-2">
      <p className="text-xs font-bold text-orange-700 mb-1">Return Request — <span className="capitalize">{ret.status}</span></p>
      <p className="text-xs text-gray-600 mb-2"><strong>Reason:</strong> {ret.reason}</p>
      {ret.status === 'pending' && (
        <div className="space-y-2">
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Admin notes (optional)" className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => handleAction('approve')} disabled={loading} className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">Approve</button>
            <button onClick={() => handleAction('reject')} disabled={loading} className="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">Reject</button>
          </div>
        </div>
      )}
      {ret.status === 'approved' && (
        <button onClick={() => handleAction('received')} disabled={loading} className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">Mark Item Received → Refund</button>
      )}
    </div>
  );
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-2.5 text-sm text-gray-700">
    <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
    <div className="min-w-0">
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  </div>
);

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderModal({
  order, onClose, onSave,
}: {
  order: PopulatedOrder;
  onClose: () => void;
  onSave: (updated: PopulatedOrder) => void;
}) {
  const [status, setStatus] = useState<MedicineOrderStatus>(order.status);
  const [notes, setNotes]   = useState(order.notes ?? '');
  const [reason, setReason] = useState(order.cancellationReason ?? '');
  const [awb, setAwb]       = useState((order as any).awb ?? '');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<CourierEvent[]>((order as any).courierStatusHistory ?? []);
  const [courierStatus, setCourierStatus]     = useState((order as any).courierStatus ?? '');
  const [courierUpdatedAt, setCourierUpdatedAt] = useState((order as any).courierStatusUpdatedAt ?? '');
  const toast = useToast();

  const showAwbField = ['packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status);
  const hasAwb = !!(order as any).awb || !!awb.trim();

  const customer     = order.userId;
  const customerName = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || 'Unknown';
  const addr         = order.shippingAddress;
  const payment      = order.payment;
  const payCfg       = PAYMENT_STATUS_CFG[payment?.status ?? 'pending'] ?? PAYMENT_STATUS_CFG.pending;

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminMedicineOrderApi.updateOrder(order.orderId, {
        status, notes, cancellationReason: reason, awb: awb.trim(),
      });
      if (res.success) {
        toast.success('Order updated');
        onSave({ ...order, status, notes, cancellationReason: reason, awb: awb.trim() } as any);
        onClose();
      }
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshTracking = async () => {
    const currentAwb = awb.trim() || (order as any).awb;
    if (!currentAwb) return;
    setRefreshing(true);
    try {
      // Re-save the AWB to trigger a fresh Delhivery fetch
      const res = await adminMedicineOrderApi.updateOrder(order.orderId, { awb: currentAwb });
      if (res.success) {
        const updated = res.order as any;
        setTrackingHistory(updated.courierStatusHistory ?? []);
        setCourierStatus(updated.courierStatus ?? '');
        setCourierUpdatedAt(updated.courierStatusUpdatedAt ?? '');
        toast.success('Tracking refreshed');
      }
    } catch {
      toast.error('Failed to refresh tracking');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Modal header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Medicine Order</p>
            <h2 className="text-lg font-extrabold text-gray-900 truncate">{order.orderId}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusBadge status={order.status} />
              {order.requiresPrescription && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  <FileText className="h-3 w-3" /> Rx
                </span>
              )}
              <span className="text-xs text-gray-400">{fmt(order.createdAt)}</span>
            </div>
            {(order as any).awb && (
              <p className="text-xs text-teal-600 font-mono font-semibold mt-1">
                AWB: {(order as any).awb} · via Delhivery
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ── Prescriptions (top — first thing admin should review) ── */}
          {(order.requiresPrescription || order.prescriptions.length > 0) && (
            <div className={`rounded-2xl p-4 space-y-3 ${
              order.prescriptions.length === 0
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-white border border-orange-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <SectionLabel><span className="text-orange-700">Prescriptions</span></SectionLabel>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  order.prescriptions.length > 0
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  {order.prescriptions.length > 0 ? `${order.prescriptions.length} uploaded` : 'Not uploaded'}
                </span>
              </div>

              {order.prescriptions.length === 0 ? (
                <p className="text-sm text-orange-600 font-medium">
                  This order requires a prescription but none has been uploaded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.prescriptions.map((rx, idx) => {
                    const isPdf = rx.url.toLowerCase().includes('.pdf') ||
                                  rx.publicId?.toLowerCase().includes('pdf') ||
                                  !rx.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i);
                    const downloadUrl = makeDownloadUrl(rx.url);
                    return (
                      <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3">
                        {/* Thumbnail or PDF icon */}
                        {isPdf ? (
                          <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
                            <FileText className="h-7 w-7 text-red-500" />
                          </div>
                        ) : (
                          <a href={rx.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <img
                              src={rx.url}
                              alt={`Prescription ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity cursor-zoom-in"
                            />
                          </a>
                        )}

                        {/* Details + actions */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">Prescription {idx + 1}</p>
                          <p className="text-xs text-gray-400">{isPdf ? 'PDF document' : 'Image'}</p>
                          {rx.uploadedAt && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Uploaded {fmt(rx.uploadedAt)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                            <a
                              href={rx.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <Download className="h-3 w-3" /> Download
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Customer ── */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <SectionLabel>Customer</SectionLabel>
            <InfoRow icon={User}  label="Name"   value={customerName} />
            <InfoRow icon={Phone} label="Mobile" value={customer?.mobileNumber ?? '—'} />
            {customer?.email && (
              <InfoRow icon={User} label="Email" value={customer.email} />
            )}
          </div>

          {/* ── Delivery Address ── */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <SectionLabel>Delivery Address</SectionLabel>
            <InfoRow icon={User}  label="Name"   value={addr.fullName} />
            <InfoRow icon={Phone} label="Mobile" value={addr.mobile} />
            <InfoRow icon={MapPin} label="Address" value={
              <span>
                {addr.addressLine1}
                {addr.email ? ` · ${addr.email}` : ''}
                {addr.landmark ? ` (Near ${addr.landmark})` : ''},{' '}
                {addr.city}, {addr.state} — {addr.pincode}
              </span>
            } />
          </div>

          {/* ── Payment ── */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <SectionLabel>Payment</SectionLabel>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${payCfg.cls}`}>
                {payCfg.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-sm font-bold text-gray-900">₹{(payment?.amount || order.grandTotal).toFixed(0)}</span>
            </div>
            {(payment as any)?.cfPaymentId && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-500">Payment ID</span>
                <span className="text-xs font-mono text-gray-600 truncate">{(payment as any).cfPaymentId}</span>
              </div>
            )}
            {payment?.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Paid At</span>
                <span className="text-xs text-gray-600">{fmt(payment.paidAt)}</span>
              </div>
            )}
          </div>

          {/* ── Items ── */}
          <div>
            <SectionLabel>Items ({order.items.length})</SectionLabel>
            <div className="space-y-2 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity}
                      {item.packSize ? ` · ${item.packSize}` : ''}
                      {item.type ? ` · ${item.type}` : ''}
                    </p>
                    {item.prescriptionRequired && (
                      <span className="text-[10px] text-orange-600 font-bold">Rx Required</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{(item.offerPrice * item.quantity).toFixed(0)}</p>
                    {item.mrp > item.offerPrice && (
                      <p className="text-xs text-gray-400 line-through">₹{(item.mrp * item.quantity).toFixed(0)}</p>
                    )}
                    {item.discountPercentage > 0 && (
                      <p className="text-[10px] text-green-600 font-bold">{item.discountPercentage}% off</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (MRP)</span><span>₹{order.subtotal.toFixed(0)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount</span><span>-₹{order.totalDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>After Discount</span><span>₹{order.totalAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span className={order.deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-gray-900 text-base pt-1.5 border-t border-gray-200">
                <span>Grand Total</span><span>₹{order.grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>


          {/* ── Delivery Dates ── */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <SectionLabel>Delivery Info</SectionLabel>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" /> Estimated Delivery
              </span>
              <span className="text-sm font-semibold text-gray-800">{fmtDate(order.estimatedDelivery)}</span>
            </div>
            {order.deliveredAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Delivered At
                </span>
                <span className="text-sm font-semibold text-green-700">{fmt(order.deliveredAt)}</span>
              </div>
            )}
            {order.cancelledAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-red-400" /> Cancelled At
                </span>
                <span className="text-sm font-semibold text-red-600">{fmt(order.cancelledAt)}</span>
              </div>
            )}
            {(['cancelled', 'refunded', 'return_requested', 'return_received'] as string[]).includes(order.status) && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">Reason:</span>
                <span className="text-xs text-gray-600 font-medium">
                  {order.cancellationReason ||
                    ((order as any).returnRequest?.reason ? `Return: ${(order as any).returnRequest.reason}` : 'No reason provided')}
                </span>
              </div>
            )}
            {(order as any).returnRequest && (
              <ReturnActionPanel order={order} onSave={onSave} />
            )}
          </div>

          {/* ── Courier Tracking ── */}
          {hasAwb && (
            <div className="border border-teal-100 rounded-2xl overflow-hidden">
              <div className="bg-teal-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-teal-600" />
                  <SectionLabel><span className="text-teal-700">Courier Tracking</span></SectionLabel>
                </div>
                <div className="flex items-center gap-3">
                  {courierStatus && (
                    <span className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                      {courierStatus}
                    </span>
                  )}
                  <button
                    onClick={handleRefreshTracking}
                    disabled={refreshing}
                    className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-mono font-bold text-gray-700">{(order as any).awb || awb}</span>
                  {((order as any).trackingUrl || awb) && (
                    <a
                      href={(order as any).trackingUrl || `https://www.delhivery.com/track/package/${awb}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline font-semibold ml-auto"
                    >
                      Track on Delhivery <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {courierUpdatedAt && (
                  <p className="text-[10px] text-gray-400">
                    Last synced: {fmt(courierUpdatedAt)}
                  </p>
                )}

                {trackingHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {trackingHistory.slice(0, 8).map((event, idx) => (
                      <div key={idx} className={`flex gap-3 text-xs py-1.5 border-b border-gray-50 last:border-0 ${idx === 0 ? 'text-teal-700 font-semibold' : 'text-gray-600'}`}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-current" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{event.status}</p>
                          {event.activity && <p className="text-gray-400 text-[10px]">{event.activity}</p>}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {event.location && <span className="text-gray-400">{event.location}</span>}
                            <span className="text-gray-400">
                              {new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No scan events yet — click Refresh to fetch latest</p>
                )}
              </div>
            </div>
          )}

          {/* ── Update Status ── */}
          <div className="space-y-4">
            <SectionLabel>Update Order</SectionLabel>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as MedicineOrderStatus)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {(Object.keys(STATUS) as MedicineOrderStatus[]).map(s => {
                  const managed = ['return_requested', 'return_received', 'refunded'].includes(s);
                  return (
                    <option key={s} value={s} disabled={managed}>
                      {STATUS[s].label}{managed ? ' (managed by panel)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {showAwbField && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                  Delhivery AWB / Tracking Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={awb}
                    onChange={e => setAwb(e.target.value)}
                    placeholder="Enter AWB number from Delhivery"
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                {awb && (
                  <a href={`https://www.delhivery.com/track/package/${awb}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mt-1.5 font-semibold">
                    <ExternalLink className="h-3 w-3" /> Preview tracking link
                  </a>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Tracking will be fetched from Delhivery automatically on save.</p>
              </div>
            )}

            {(status === 'cancelled' || status === 'refunded') && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Cancellation Reason</label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Reason for cancellation or refund"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Admin Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Internal notes (not visible to customer)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MedicineOrdersPage() {
  const { isAdmin, hasPermission } = useAdminAuth();
  const toast = useToast();

  const [orders, setOrders]             = useState<PopulatedOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);

  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<PopulatedOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMedicineOrderApi.getOrders({
        page, limit: 20, search: search || undefined, status: statusFilter || undefined,
      });
      if (res.success) {
        setOrders(res.orders as PopulatedOrder[]);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setStatusCounts(res.statusCounts ?? {});
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (!isAdmin && !hasPermission(PERMISSIONS.MED_ORDERS_VIEW)) return <AccessDenied section="Medicine Orders" />;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleModalSave = (updated: PopulatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updated.orderId ? updated : o));
    setSelectedOrder(updated);
  };

  const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const delivered   = statusCounts['delivered'] ?? 0;
  const inTransit   = (statusCounts['packed'] ?? 0) + (statusCounts['shipped'] ?? 0) + (statusCounts['out_for_delivery'] ?? 0);
  const rxPending   = statusCounts['prescription_required'] ?? 0;
  const confirmed   = statusCounts['confirmed'] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-100 mb-2">
            <Pill className="h-3 w-3" /> Medicine Orders
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Medicine Orders</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">{total} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: totalOrders, icon: ClipboardList, color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'In Transit',   value: inTransit,   icon: Truck,         color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Delivered',    value: delivered,   icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Rx Pending',   value: rxPending,   icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`${stat.bg} p-3 rounded-xl`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by Order ID, AWB or customer..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          <option value="">All Statuses</option>
          {(Object.keys(STATUS) as MedicineOrderStatus[]).map(s => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-sm font-semibold text-gray-500">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="h-12 w-12 text-gray-200" />
            <p className="font-bold text-gray-400">No orders found</p>
            {(search || statusFilter) && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setPage(1); }}
                className="text-sm text-blue-600 hover:underline font-semibold">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  const customer    = order.userId;
                  const name        = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || '—';
                  const firstItem   = order.items[0];
                  const itemsSummary = order.items.length === 1
                    ? firstItem?.name
                    : `${firstItem?.name} +${order.items.length - 1} more`;
                  const awb = (order as any).awb;

                  return (
                    <tr key={order.orderId} className={`hover:bg-gray-50/50 transition-colors${(order as any).status === 'return_requested' ? ' bg-orange-50' : ''}`}>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700">{order.orderId}</span>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {order.requiresPrescription && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                              <FileText className="h-2.5 w-2.5" /> Rx
                            </span>
                          )}
                          {awb && (
                            <span className="text-[10px] text-teal-600 font-mono font-semibold">AWB: {awb}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">{customer?.mobileNumber ?? ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 truncate max-w-[180px]">{itemsSummary}</p>
                        <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-gray-900">₹{order.grandTotal.toFixed(0)}</p>
                        {order.deliveryCharge === 0
                          ? <p className="text-[10px] text-green-600 font-bold">Free delivery</p>
                          : <p className="text-[10px] text-gray-400">+₹{order.deliveryCharge} delivery</p>
                        }
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        <p>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        {order.estimatedDelivery && (
                          <p className="text-[10px] text-gray-400">
                            Est: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors">
                            View
                          </button>
                          {(order as any).status === 'return_requested' && (
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full text-center">Return Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Page {page} of {totalPages} · {total} orders</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
