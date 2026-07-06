'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Phone, Mail, User, Clock, CheckCircle2, X,
  Loader2, ChevronLeft, ChevronRight, ShoppingBag, RotateCcw, Download,
} from 'lucide-react';
import adminPrescriptionApi, { AdminPrescription } from '@/lib/api/adminPrescriptionApi';
import { useToast } from '@/providers/ToastProvider';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';
import BookMedicineModal from '@/components/admin/orders/BookMedicineModal';
import type { CustomerUser } from '@/types/admin';

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Cloudinary: force download instead of inline preview
const makeDownloadUrl = (url: string) => url.replace('/upload/', '/upload/fl_attachment/');
const isPdf = (url: string) => /\.pdf($|\?)/i.test(url) || !/\.(jpg|jpeg|png|webp)($|\?)/i.test(url);

function PrescriptionModal({ rx, onClose, onUpdated, onBook }: {
  rx: AdminPrescription;
  onClose: () => void;
  onUpdated: (p: AdminPrescription) => void;
  onBook: (user: CustomerUser, prescriptionId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const u = rx.userId;
  const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown' : 'Unknown';

  const act = async (action: 'mark_done' | 'reopen') => {
    setBusy(true);
    try {
      const res = await adminPrescriptionApi.update(rx._id, action);
      if (res.success) {
        toast.success(action === 'mark_done' ? 'Marked as done' : 'Reopened');
        onUpdated(res.prescription);
      }
    } catch { toast.error('Action failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prescription</p>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-gray-900">{name}</h2>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                rx.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                {rx.status === 'pending' ? 'Pending' : 'Done'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Uploaded {fmt(rx.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Contact */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact for confirmation call</p>
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Phone className="h-4 w-4 text-gray-400" />
              <a href={`tel:${rx.contactMobile}`} className="font-bold text-teal-700 hover:underline">{rx.contactMobile}</a>
            </div>
            {rx.contactEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{rx.contactEmail}</span>
              </div>
            )}
            {u && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="h-3.5 w-3.5 text-gray-400" />
                Account: {name} · {u.mobileNumber}
              </div>
            )}
            {rx.note && <p className="text-xs text-gray-600 pt-1"><strong>Note:</strong> {rx.note}</p>}
          </div>

          {/* Files */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Prescription Files ({rx.files.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rx.files.map((f, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  {isPdf(f.url) ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-28 bg-red-50">
                      <FileText className="h-8 w-8 text-red-400" />
                      <span className="text-[10px] text-red-500 font-bold mt-1">PDF {i + 1}</span>
                    </a>
                  ) : (
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={`Rx ${i + 1}`} className="w-full h-28 object-cover hover:opacity-90 transition-opacity" />
                    </a>
                  )}
                  <a href={makeDownloadUrl(f.url)} className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 border-t border-gray-100">
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Linked orders */}
          {rx.createdOrderIds.length > 0 && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
              <p className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-1">Booked Orders</p>
              <div className="flex flex-wrap gap-2">
                {rx.createdOrderIds.map(oid => (
                  <span key={oid} className="text-xs font-mono font-semibold text-teal-700 bg-white border border-teal-200 rounded-lg px-2 py-0.5">{oid}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          {u && (
            <button
              onClick={() => onBook({
                _id: u._id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                mobileNumber: u.mobileNumber,
                isActive: true,
                createdAt: '', updatedAt: '',
              } as CustomerUser, rx._id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Book Medicines
            </button>
          )}
          {rx.status === 'pending' ? (
            <button onClick={() => act('mark_done')} disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Mark Done
            </button>
          ) : (
            <button onClick={() => act('reopen')} disabled={busy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPrescriptionsPage() {
  const { isAdmin, hasPermission } = useAdminAuth();
  const toast = useToast();

  const [items, setItems]     = useState<AdminPrescription[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter]   = useState<'all' | 'pending' | 'done'>('pending');
  const [selected, setSelected] = useState<AdminPrescription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPrescriptionApi.list({
        page,
        status: filter === 'all' ? undefined : filter,
      });
      if (res.success) {
        setItems(res.prescriptions);
        setPending(res.pendingCount);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch { toast.error('Failed to load prescriptions'); }
    finally { setLoading(false); }
  }, [page, filter, toast]);

  useEffect(() => { load(); }, [load]);

  const [booking, setBooking] = useState<{ user: CustomerUser; prescriptionId: string } | null>(null);

  const onUpdated = (p: AdminPrescription) => {
    setItems(prev => prev.map(x => x._id === p._id ? p : x));
    setSelected(p);
    // refresh counts/list to reflect filter changes
    load();
  };

  const onBook = (user: CustomerUser, prescriptionId: string) => {
    setSelected(null);
    setBooking({ user, prescriptionId });
  };

  if (!isAdmin && !hasPermission(PERMISSIONS.PRESCRIPTION_BOOKING)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Prescriptions</h1>
            <p className="text-sm text-gray-400">Uploaded prescriptions to review &amp; book on behalf</p>
          </div>
        </div>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-orange-50 text-orange-600 border border-orange-200">
            {pending} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'done', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold capitalize transition-colors ${
              filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No prescriptions {filter !== 'all' ? filter : ''} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(rx => {
            const u = rx.userId;
            const name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Unknown' : 'Unknown';
            return (
              <button
                key={rx._id}
                onClick={() => setSelected(rx)}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-rose-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 truncate">{name}</p>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${
                        rx.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {rx.status === 'pending' ? 'PENDING' : 'DONE'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" />{rx.contactMobile}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{fmt(rx.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-rose-500 flex-shrink-0">
                    <FileText className="h-3.5 w-3.5" /> {rx.files.length}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {selected && (
        <PrescriptionModal rx={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} onBook={onBook} />
      )}

      {booking && (
        <BookMedicineModal
          user={booking.user}
          prescriptionId={booking.prescriptionId}
          onClose={() => setBooking(null)}
          onSuccess={(msg) => { setBooking(null); toast.success(msg); load(); }}
        />
      )}
    </div>
  );
}
