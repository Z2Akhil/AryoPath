'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doctorApi } from '@/lib/api/doctorApi';
import { DoctorPortalAppointment } from '@/types/doctor';

const statusColor: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function AppointmentDetailPage() {
    const { id }  = useParams<{ id: string }>();
    const router  = useRouter();
    const [appt, setAppt]         = useState<DoctorPortalAppointment | null>(null);
    const [loading, setLoading]   = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError]       = useState('');

    useEffect(() => {
        doctorApi.getAppointment(id)
            .then(data => setAppt(data.appointment))
            .catch(() => setError('Failed to load appointment'))
            .finally(() => setLoading(false));
    }, [id]);

    const updateStatus = async (status: string) => {
        if (!appt) return;
        setUpdating(true);
        try {
            const data = await doctorApi.updateAppointmentStatus(id, status);
            setAppt(data.appointment);
        } catch {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !appt) {
        return <div className="p-6 text-red-500 text-sm">{error || 'Appointment not found'}</div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
                ← Back to appointments
            </button>

            {/* Status + Meet */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {appt.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {appt.status === 'pending' && (
                            <button
                                onClick={() => updateStatus('confirmed')}
                                disabled={updating}
                                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                Confirm
                            </button>
                        )}
                        {appt.status === 'confirmed' && (
                            <button
                                onClick={() => updateStatus('completed')}
                                disabled={updating}
                                className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                Mark Completed
                            </button>
                        )}
                        {appt.meetLink && appt.consultationMode === 'video' && (
                            <a
                                href={appt.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Join Meet
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Patient info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Patient Information</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                        { label: 'Name',   value: appt.patientName },
                        { label: 'Mobile', value: appt.patientMobile },
                        { label: 'Email',  value: appt.patientEmail || '—' },
                        { label: 'Age',    value: appt.patientAge ? `${appt.patientAge} years` : '—' },
                        { label: 'Gender', value: appt.patientGender || '—' },
                    ].map(row => (
                        <div key={row.label}>
                            <p className="text-xs text-gray-400">{row.label}</p>
                            <p className="text-sm text-gray-900 mt-0.5">{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Appointment details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Appointment Details</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                        { label: 'Date',    value: appt.appointmentDate },
                        { label: 'Time',    value: appt.appointmentTime },
                        { label: 'Mode',    value: appt.consultationMode },
                        { label: 'Fee',     value: `₹${appt.finalAmount}` },
                    ].map(row => (
                        <div key={row.label}>
                            <p className="text-xs text-gray-400">{row.label}</p>
                            <p className="text-sm text-gray-900 mt-0.5 capitalize">{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Symptoms / Notes */}
            {appt.symptoms && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">Patient Notes / Symptoms</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.symptoms}</p>
                </div>
            )}

            {/* Report files */}
            {appt.reportUrls?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Reports ({appt.reportUrls.length})</h2>
                    <div className="space-y-2">
                        {appt.reportUrls.map((file, i) => (
                            <a
                                key={file.publicId}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
                            >
                                <svg className="w-5 h-5 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm text-teal-700">Report {i + 1}</span>
                                <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
