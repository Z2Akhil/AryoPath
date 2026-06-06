'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Calendar, Clock, User, Phone, Mail, Video, Headphones,
    IndianRupee, CheckCircle, XCircle, AlertCircle, FileText, Pill,
    Loader2, RefreshCw,
} from 'lucide-react';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';
import adminAppointmentApi from '@/lib/api/adminAppointmentApi';
import { adminAxios } from '@/lib/api/adminAxios';

function RefundButton({ apptId }: { apptId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState('');
  const handle = async () => {
    if (!confirm('Initiate Cashfree refund for this appointment?')) return;
    setLoading(true); setErr('');
    try {
      const r = await adminAxios.post(`/admin/appointments/${apptId}/refund`);
      if (r.data.success) setDone(true);
      else setErr(r.data.error || 'Refund failed');
    } catch { setErr('Refund failed'); }
    finally { setLoading(false); }
  };
  if (done) return <p className="text-xs text-green-600 font-medium mt-2">Refund initiated</p>;
  return (
    <div className="mt-2">
      {err && <p className="text-xs text-red-500 mb-1">{err}</p>}
      <button onClick={handle} disabled={loading} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
        {loading ? 'Processing...' : 'Initiate Refund'}
      </button>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800 border-yellow-200',  icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200',        icon: CheckCircle },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200',     icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200',           icon: XCircle },
    no_show:   { label: 'Expired',   color: 'bg-gray-100 text-gray-600 border-gray-200',         icon: XCircle },
    expired:   { label: 'Expired',   color: 'bg-gray-100 text-gray-600 border-gray-200',         icon: XCircle },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
    paid:         { label: 'Paid',         color: 'text-green-600' },
    pending:      { label: 'Pending',       color: 'text-yellow-600' },
    failed:       { label: 'Failed',        color: 'text-red-600' },
    not_required: { label: 'Not Required',  color: 'text-gray-500' },
};

const VALID_TRANSITIONS: Record<string, ('confirmed' | 'completed' | 'cancelled')[]> = {
    pending:   ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
};

function fmt(dt: string | Date | undefined) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-start py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 shrink-0 mr-4">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
        </div>
    );
}

export default function AppointmentDetailPage() {
    const { isAdmin, hasPermission } = useAdminAuth();
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [appt, setAppt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canView = isAdmin || hasPermission(PERMISSIONS.APPOINTMENTS_VIEW);
    const canEdit = isAdmin || hasPermission(PERMISSIONS.APPOINTMENTS_EDIT);

    const fetch = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await adminAppointmentApi.getById(id);
            if (res.success) setAppt(res.appointment);
            else setError(res.error || 'Failed to load appointment');
        } catch {
            setError('Failed to load appointment');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetch(); }, [fetch]);

    const updateStatus = async (status: 'confirmed' | 'completed' | 'cancelled') => {
        setUpdating(true);
        try {
            const res = await adminAppointmentApi.updateStatus(id, status);
            if (res.success) setAppt(res.appointment);
        } finally {
            setUpdating(false);
        }
    };

    if (!canView) return <AccessDenied section="Appointments" />;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );

    if (error || !appt) return (
        <div className="p-6 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">{error || 'Appointment not found'}</p>
            </div>
        </div>
    );

    const slotExpired  = ['pending', 'confirmed'].includes(appt.status) &&
                         new Date(appt.appointmentDateTime).getTime() + 30 * 60 * 1000 < Date.now();
    const displayStatus = slotExpired ? 'expired' : appt.status;
    const statusCfg  = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.pending;
    const StatusIcon = statusCfg.icon;
    const paymentCfg = PAYMENT_STATUS[appt.payment?.status || 'not_required'];
    const transitions = slotExpired ? [] : (VALID_TRANSITIONS[appt.status] || []);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                    <ArrowLeft className="w-4 h-4" /> Back to Appointments
                </button>
                <button onClick={fetch} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Title row */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-xs text-gray-400 font-mono mb-1">{appt._id}</p>
                    <h1 className="text-xl font-bold text-gray-900">
                        {appt.patientName} → Dr. {appt.doctorName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        {appt.consultationMode === 'video'
                            ? <Video className="w-4 h-4 text-blue-500" />
                            : <Headphones className="w-4 h-4 text-purple-500" />}
                        {appt.consultationMode === 'video' ? 'Video' : 'Audio'} consultation
                        <span className="text-gray-300">·</span>
                        <Calendar className="w-4 h-4" />
                        {appt.appointmentDate} at {appt.appointmentTime}
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusCfg.label}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Patient info */}
                <Section title="Patient">
                    <Row label="Name" value={appt.patientName} />
                    <Row label="Age / Gender" value={`${appt.patientAge} / ${appt.patientGender}`} />
                    <Row label="Mobile" value={
                        <a href={`tel:${appt.patientMobile}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />{appt.patientMobile}
                        </a>
                    } />
                    <Row label="Email" value={
                        appt.patientEmail
                            ? <a href={`mailto:${appt.patientEmail}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" />{appt.patientEmail}
                              </a>
                            : null
                    } />
                    <Row label="Symptoms" value={appt.symptoms} />
                </Section>

                {/* Payment */}
                <Section title="Payment">
                    <Row label="Consultation Fee" value={<span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{appt.consultationFee}</span>} />
                    {appt.platformDiscount > 0 && <Row label="Platform Discount" value={`-₹${appt.platformDiscount}`} />}
                    {appt.couponCode && <Row label="Coupon" value={`${appt.couponCode} (-₹${appt.couponDiscount})`} />}
                    <Row label="Final Amount" value={<span className="font-bold flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{appt.finalAmount}</span>} />
                    <Row label="Payment Status" value={
                        <span className={`font-semibold ${paymentCfg.color}`}>{paymentCfg.label}</span>
                    } />
                    {appt.payment?.cfOrderId && <Row label="CF Order ID" value={<span className="font-mono text-xs">{appt.payment.cfOrderId}</span>} />}
                    {appt.payment?.paidAt && <Row label="Paid At" value={fmt(appt.payment.paidAt)} />}
                </Section>

                {/* Doctor & consultation */}
                <Section title="Consultation">
                    <Row label="Doctor" value={appt.doctorName} />
                    <Row label="Doctor Mobile" value={
                        <a href={`tel:${appt.doctorMobile}`} className="text-blue-600 hover:underline">{appt.doctorMobile}</a>
                    } />
                    <Row label="Mode" value={appt.consultationMode === 'video' ? 'Video Call' : 'Audio Call'} />
                    <Row label="Date & Time" value={`${appt.appointmentDate} · ${appt.appointmentTime}`} />
                    {appt.meetLink && (
                        <Row label="Meet Link" value={
                            <a href={appt.meetLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                {appt.meetLink}
                            </a>
                        } />
                    )}
                    <Row label="Created" value={fmt(appt.createdAt)} />
                </Section>

                {/* Status actions */}
                <Section title="Actions">
                    <p className="text-xs text-gray-400 mb-3">
                        {transitions.length === 0
                            ? 'No further status changes available.'
                            : canEdit ? 'Update appointment status:' : 'Read-only — no edit permission.'}
                        {appt.status === 'cancelled' && appt.payment?.status === 'paid' &&
                          !(appt.payment as any).refundStatus || (appt.payment as any)?.refundStatus === 'none' ? (
                          <RefundButton apptId={appt._id} />
                        ) : (appt.payment as any)?.refundStatus && (appt.payment as any).refundStatus !== 'none' ? (
                          <p className="text-xs text-green-600 font-medium mt-2">Refund {(appt.payment as any).refundStatus}</p>
                        ) : null}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {transitions.map(t => (
                            <button
                                key={t}
                                onClick={() => updateStatus(t)}
                                disabled={!canEdit || updating}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    t === 'cancelled'
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                        : t === 'completed'
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </Section>
            </div>

            {/* Reports */}
            {appt.reportUrls?.length > 0 && (
                <Section title="Uploaded Reports">
                    <div className="flex flex-wrap gap-3">
                        {appt.reportUrls.map((r: any, i: number) => (
                            <a key={i} href={r.url} target="_blank" rel="noreferrer"
                               className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-100">
                                <FileText className="w-4 h-4" /> Report {i + 1}
                            </a>
                        ))}
                    </div>
                </Section>
            )}

            {/* Prescription */}
            {appt.prescription && (
                <Section title="Prescription">
                    <p className="text-xs text-gray-400 mb-3">Issued: {fmt(appt.prescription.issuedAt)}</p>
                    {appt.prescription.notes && (
                        <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg">{appt.prescription.notes}</p>
                    )}
                    {appt.prescription.medicines?.length > 0 && (
                        <div className="space-y-2">
                            {appt.prescription.medicines.map((m: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Pill className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">{m.name}</p>
                                        <p className="text-gray-500 text-xs">{m.dose} · {m.frequency} · {m.duration}</p>
                                        {m.instructions && <p className="text-gray-400 text-xs mt-0.5">{m.instructions}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            )}
        </div>
    );
}
