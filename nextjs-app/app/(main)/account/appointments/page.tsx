'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Video, Phone, Calendar, Clock,
  ExternalLink, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp, Printer, X,
} from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

interface PrescriptionMedicine {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  medicines: PrescriptionMedicine[];
  notes: string;
  issuedAt: string;
}

interface Appointment {
  _id: string;
  doctorName: string;
  doctorSlug: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationMode: 'video' | 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'refunded';
  finalAmount: number;
  meetLink?: string;
  prescription?: Prescription;
  appointmentDateTime: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string; bar: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-600 border-amber-100',   bar: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-600 border-blue-100',      bar: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-100',   bar: 'bg-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-500 border-red-100',         bar: 'bg-red-300' },
  no_show:   { label: 'No Show',   className: 'bg-gray-50 text-gray-500 border-gray-100',       bar: 'bg-gray-300' },
  expired:   { label: 'Expired',   className: 'bg-gray-50 text-gray-400 border-gray-100',       bar: 'bg-gray-200' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-50 text-gray-500 border-gray-100', bar: 'bg-gray-300' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  );
}

function PrescriptionCard({ prescription, doctorName, patientName, appointmentDate }: {
  prescription: Prescription;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
}) {
  const issued = new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Prescription - Dr. ${doctorName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
        .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .rx { font-size: 48px; font-weight: 900; font-style: italic; color: #0d9488; line-height: 1; }
        .doctor { font-size: 20px; font-weight: bold; }
        .subtitle { font-size: 13px; color: #555; margin-top: 4px; }
        .patient-row { display: flex; gap: 40px; margin-bottom: 20px; font-size: 13px; }
        .label { font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0fdfa; text-align: left; padding: 8px 12px; font-size: 11px; border: 1px solid #b2f5ea; color: #0d9488; }
        td { padding: 8px 12px; font-size: 12px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background: #f9fafb; }
        .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 12px; margin-bottom: 20px; }
        .notes-label { font-size: 10px; font-weight: bold; color: #d97706; text-transform: uppercase; margin-bottom: 6px; }
        .footer { font-size: 10px; color: #999; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 20px; }
      </style></head>
      <body>
        <div class="header">
          <div><div class="rx">℞</div><div class="subtitle">Digital Prescription</div></div>
          <div style="text-align:right"><div class="doctor">Dr. ${doctorName}</div><div class="subtitle">AyroPath Consultation</div><div class="subtitle">Date: ${issued}</div></div>
        </div>
        <div class="patient-row">
          <div><div class="label">Patient</div><div>${patientName}</div></div>
          <div><div class="label">Appointment Date</div><div>${appointmentDate}</div></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
          <tbody>
            ${prescription.medicines.map((m, i) => `<tr><td>${i+1}</td><td><strong>${m.name}</strong></td><td>${m.dose||'—'}</td><td>${m.frequency||'—'}</td><td>${m.duration||'—'}</td><td>${m.instructions||'—'}</td></tr>`).join('')}
          </tbody>
        </table>
        ${prescription.notes ? `<div class="notes"><div class="notes-label">Doctor's Advice</div>${prescription.notes}</div>` : ''}
        <div class="footer">This is a digital prescription issued via AyroPath. Take medicines as directed. Consult your doctor if symptoms persist.</div>
      </body></html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(printContent);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="mt-3 rounded-xl border border-teal-100 overflow-hidden bg-teal-50/30">
      {/* Rx header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black italic">℞</span>
          <div>
            <p className="text-xs font-bold leading-none">Digital Prescription</p>
            <p className="text-[10px] opacity-80 mt-0.5">Dr. {doctorName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] opacity-80 hidden sm:block">{issued}</p>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Medicines table */}
      <div className="p-4">
        <div className="overflow-x-auto rounded-lg border border-teal-100">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-teal-100/60 text-teal-800">
                <th className="text-left px-3 py-2 font-bold">#</th>
                <th className="text-left px-3 py-2 font-bold">Medicine</th>
                <th className="text-left px-3 py-2 font-bold">Dose</th>
                <th className="text-left px-3 py-2 font-bold">Frequency</th>
                <th className="text-left px-3 py-2 font-bold">Duration</th>
                <th className="text-left px-3 py-2 font-bold">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescription.medicines.map((med, idx) => (
                <tr key={idx} className="border-t border-teal-100 bg-white">
                  <td className="px-3 py-2.5 text-gray-400 font-medium">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-900">{med.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{med.dose || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{med.frequency || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{med.duration || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-500 italic">{med.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {prescription.notes && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Doctor's Advice</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
          </div>
        )}

        <p className="mt-3 text-[10px] text-gray-400 text-center">
          Digital prescription issued by Dr. {doctorName} via AyroPath.
          Take medicines as directed. Consult your doctor if symptoms persist.
        </p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRx, setExpandedRx] = useState<Record<string, boolean>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    setConfirmCancelId(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    try {
      const res = await fetch(`/api/user/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason: 'Cancelled by patient' }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
      } else {
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch {
      alert('Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!userLoading && !user) router.replace('/');
  }, [mounted, user, userLoading, router]);

  useEffect(() => {
    if (!mounted || !user) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    fetch('/api/user/appointments', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAppointments(data.data);
        else setError('Failed to load appointments');
      })
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [mounted, user]);

  const toggleRx = (id: string) => setExpandedRx(prev => ({ ...prev, [id]: !prev[id] }));

  if (!mounted || userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-extrabold text-gray-900">My Appointments</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm font-bold text-blue-600">
              Retry
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base mb-1">No appointments yet</p>
              <p className="text-sm text-gray-400">Book a consultation with one of our doctors</p>
            </div>
            <Link href="/consult" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm">
              Book Consultation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const isVideo         = appt.consultationMode === 'video';
              const msUntil         = new Date(appt.appointmentDateTime).getTime() - Date.now();
              const slotEnded       = msUntil < -30 * 60 * 1000; // 30 min past slot start = expired
              const isActive        = ['pending', 'confirmed'].includes(appt.status) && !slotEnded;
              const isExpired       = ['pending', 'confirmed'].includes(appt.status) && slotEnded;
              const isCompleted     = appt.status === 'completed';
              const shortId         = appt._id.slice(-8).toUpperCase();
              const canCancel       = isActive && msUntil > 2 * 60 * 60 * 1000;
              const withinWindow    = isActive && msUntil <= 2 * 60 * 60 * 1000;
              const isCancelConfirm = confirmCancelId === appt._id;
              const isCancelling    = cancellingId === appt._id;
              const barColor        = (isExpired ? STATUS_STYLES['expired'] : STATUS_STYLES[appt.status])?.bar ?? 'bg-gray-300';
              const hasPrescription = !!(appt.prescription && appt.prescription.medicines.length > 0);
              const rxOpen          = !!expandedRx[appt._id];

              return (
                <div key={appt._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`h-1 ${barColor}`} />

                  <div className="p-4">
                    {/* Doctor + status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="text-sm font-extrabold text-gray-900 truncate">
                            Dr. {appt.doctorName}
                          </p>
                          <StatusBadge status={isExpired ? 'expired' : appt.status} />
                        </div>
                        <p className="text-xs text-gray-400 font-mono">#{shortId}</p>
                      </div>
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        isVideo ? 'bg-blue-50' : 'bg-purple-50'
                      }`}>
                        {isVideo
                          ? <Video className="w-4 h-4 text-blue-600" />
                          : <Phone className="w-4 h-4 text-purple-600" />
                        }
                      </div>
                    </div>

                    {/* Date / time / mode */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">{appt.appointmentDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 font-medium">{appt.appointmentTime}</span>
                      </div>
                      <span className={`text-xs font-semibold capitalize ${isVideo ? 'text-blue-600' : 'text-purple-600'}`}>
                        {appt.consultationMode} call
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Amount paid</span>
                      <span className="text-sm font-black text-gray-900">₹{appt.finalAmount}</span>
                    </div>

                    {/* Join meeting */}
                    {isActive && isVideo && appt.meetLink && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 mb-2 font-medium">
                          Join 2 minutes before your appointment time
                        </p>
                        <a
                          href={appt.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Cancel button */}
                    {(canCancel || withinWindow) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {withinWindow ? (
                          <p className="text-xs text-amber-600 font-medium">Cannot cancel within 2 hours of appointment</p>
                        ) : isCancelConfirm ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600">Are you sure? A full refund will be initiated if applicable.</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancel(appt._id)}
                                disabled={!!isCancelling}
                                className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                              >
                                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                Yes, Cancel
                              </button>
                              <button onClick={() => setConfirmCancelId(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl">
                                Keep
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(appt._id)}
                            className="w-full py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expired / no-show */}
                    {(isExpired || appt.status === 'no_show') && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium">Appointment slot has passed</p>
                      </div>
                    )}

                    {/* Prescription section — always visible on completed appointments */}
                    {(isCompleted || hasPrescription) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {hasPrescription ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleRx(appt._id)}
                              className="flex items-center justify-between w-full"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-xs font-bold text-teal-700">View / Download Prescription</span>
                              </div>
                              {rxOpen
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                              }
                            </button>

                            {rxOpen && (
                              <PrescriptionCard
                                prescription={appt.prescription!}
                                doctorName={appt.doctorName}
                                patientName={appt.patientName}
                                appointmentDate={appt.appointmentDate}
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                            <span className="text-xs text-gray-400">Prescription not issued yet</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
