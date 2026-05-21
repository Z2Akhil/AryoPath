'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Pill, Package, Truck, CheckCircle2, XCircle,
  AlertTriangle, ChevronLeft, ChevronRight, X, FileText,
  RefreshCw, Loader2, MapPin, Phone, User, Calendar,
  ClipboardList, ExternalLink,
} from 'lucide-react';
import adminMedicineOrderApi from '@/lib/api/adminMedicineOrderApi';
import type { MedicineOrder, MedicineOrderStatus } from '@/types/medicineOrder';
import { useToast } from '@/providers/ToastProvider';

type PopulatedOrder = MedicineOrder & {
  userId: { firstName: string; lastName: string; mobileNumber: string; email?: string };
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<MedicineOrderStatus, { label: string; cls: string }> = {
  pending_payment:       { label: 'Pending Payment',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  payment_failed:        { label: 'Payment Failed',     cls: 'bg-red-50 text-red-600 border-red-200' },
  confirmed:             { label: 'Confirmed',           cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  prescription_required: { label: 'Rx Required',        cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  prescription_verified: { label: 'Rx Verified',        cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  packed:                { label: 'Packed',              cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  shipped:               { label: 'Shipped',             cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  out_for_delivery:      { label: 'Out for Delivery',   cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  delivered:             { label: 'Delivered',           cls: 'bg-green-50 text-green-700 border-green-200' },
  cancelled:             { label: 'Cancelled',           cls: 'bg-red-50 text-red-600 border-red-200' },
  refunded:              { label: 'Refunded',            cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const StatusBadge = ({ status }: { status: MedicineOrderStatus }) => {
  const cfg = STATUS[status] ?? { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderModal({
  order, onClose, onSave,
}: {
  order: PopulatedOrder;
  onClose: () => void;
  onSave: (updated: PopulatedOrder) => void;
}) {
  const [status, setStatus]     = useState<MedicineOrderStatus>(order.status);
  const [notes, setNotes]       = useState(order.notes ?? '');
  const [reason, setReason]     = useState(order.cancellationReason ?? '');
  const [saving, setSaving]     = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminMedicineOrderApi.updateOrder(order.orderId, {
        status,
        notes,
        cancellationReason: reason,
      });
      if (res.success) {
        toast.success('Order updated');
        onSave({ ...order, status, notes, cancellationReason: reason });
        onClose();
      }
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const customer = order.userId;
  const customerName = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || 'Unknown';
  const addr = order.shippingAddress;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Medicine Order</p>
            <h2 className="text-lg font-extrabold text-gray-900">{order.orderId}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Status + Date row */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            {order.requiresPrescription && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                <FileText className="h-3 w-3" /> Rx Required
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          {/* Customer */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Customer</p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold">{customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{customer?.mobileNumber ?? '—'}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>
                {addr.fullName}, {addr.addressLine1}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                {addr.landmark ? ` (Near ${addr.landmark})` : ''},{' '}
                {addr.city}, {addr.state} — {addr.pincode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{addr.mobile}</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Items ({order.items.length})</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} {item.packSize ? `· ${item.packSize}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">₹{(item.offerPrice * item.quantity).toFixed(0)}</p>
                    {item.mrp > item.offerPrice && (
                      <p className="text-xs text-gray-400 line-through">₹{(item.mrp * item.quantity).toFixed(0)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price summary */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (MRP)</span><span>₹{order.subtotal.toFixed(0)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount</span><span>-₹{order.totalDiscount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span className={order.deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                  {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-gray-900 text-base pt-1 border-t border-gray-100">
                <span>Grand Total</span><span>₹{order.grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          {order.prescriptions.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Prescriptions</p>
              <div className="flex flex-wrap gap-2">
                {order.prescriptions.map((rx, idx) => (
                  <a
                    key={idx}
                    href={rx.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Prescription {idx + 1}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Update status */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Status</p>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as MedicineOrderStatus)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {(Object.keys(STATUS) as MedicineOrderStatus[]).map(s => (
                <option key={s} value={s}>{STATUS[s].label}</option>
              ))}
            </select>

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
                rows={3}
                placeholder="Internal notes (not visible to customer)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MedicineOrdersPage() {
  const toast = useToast();

  const [orders, setOrders]           = useState<PopulatedOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);

  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleModalSave = (updated: PopulatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updated.orderId ? updated : o));
  };

  const totalOrders  = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const delivered    = statusCounts['delivered'] ?? 0;
  const inTransit    = (statusCounts['packed'] ?? 0) + (statusCounts['shipped'] ?? 0) + (statusCounts['out_for_delivery'] ?? 0);
  const rxPending    = statusCounts['prescription_required'] ?? 0;
  const cancelled    = statusCounts['cancelled'] ?? 0;

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
          { label: 'Total Orders',    value: totalOrders, icon: ClipboardList, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'In Transit',      value: inTransit,   icon: Truck,         color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Delivered',       value: delivered,   icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Rx Pending',      value: rxPending,   icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
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
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by Order ID or customer..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
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
              <button onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setPage(1); }} className="text-sm text-blue-600 hover:underline font-semibold">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => {
                  const customer = order.userId;
                  const name = `${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim() || '—';
                  const firstItem = order.items[0];
                  const itemsSummary = order.items.length === 1
                    ? firstItem?.name
                    : `${firstItem?.name} +${order.items.length - 1} more`;

                  return (
                    <tr key={order.orderId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-gray-700">{order.orderId}</span>
                        {order.requiresPrescription && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                            <FileText className="h-2.5 w-2.5" /> Rx
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">{name}</p>
                        <p className="text-xs text-gray-400">{customer?.mobileNumber ?? ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 truncate max-w-[180px]">{itemsSummary}</p>
                        <p className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                      </td>
                      <td className="px-5 py-4 font-extrabold text-gray-900">
                        ₹{order.grandTotal.toFixed(0)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
                        >
                          View
                        </button>
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
            <p className="text-xs text-gray-500 font-medium">
              Page {page} of {totalPages} · {total} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
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
