'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Video, Phone, Calendar, Clock,
  ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

interface Appointment {
  _id: string;
  doctorName: string;
  doctorSlug: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  consultationMode: 'video' | 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  finalAmount: number;
  meetLink?: string;
}

const STATUS_STYLES: Record<string, { label: string; className: string; bar: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-50 text-amber-600 border-amber-100',   bar: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-600 border-blue-100',      bar: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-600 border-green-100',   bar: 'bg-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-500 border-red-100',         bar: 'bg-red-300' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-50 text-gray-500 border-gray-100', bar: 'bg-gray-300' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.className}`}>
      {s.label}
    </span>
  );
}

export default function AppointmentsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-bold text-blue-600"
            >
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
            <Link
              href="/consult"
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              Book Consultation
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const isVideo = appt.consultationMode === 'video';
              const isActive = ['pending', 'confirmed'].includes(appt.status);
              const shortId = appt._id.slice(-8).toUpperCase();
              const barColor = STATUS_STYLES[appt.status]?.bar ?? 'bg-gray-300';

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
                          <StatusBadge status={appt.status} />
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

                    {/* Join meeting — only for active video appointments with a meet link */}
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
