'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { doctorApi } from '@/lib/api/doctorApi';
import { DoctorPortalAppointment } from '@/types/doctor';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const statusColor: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<DoctorPortalAppointment[]>([]);
    const [total, setTotal]               = useState(0);
    const [page, setPage]                 = useState(1);
    const [status, setStatus]             = useState('all');
    const [date, setDate]                 = useState('');
    const [loading, setLoading]           = useState(true);

    const limit = 20;

    useEffect(() => {
        setLoading(true);
        const params: Record<string, any> = { page, limit };
        if (status !== 'all') params.status = status;
        if (date) params.date = date;

        doctorApi.getAppointments(params)
            .then(data => {
                setAppointments(data.appointments);
                setTotal(data.total);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [page, status, date]);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
                <span className="text-sm text-gray-500">{total} total</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={date}
                    onChange={e => { setDate(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {date && (
                    <button onClick={() => { setDate(''); setPage(1); }} className="text-sm text-gray-500 hover:text-gray-700 underline">
                        Clear date
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                    <p className="text-sm">No appointments found.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {appointments.map(appt => (
                            <Link
                                key={appt._id}
                                href={`/doctor/appointments/${appt._id}`}
                                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{appt.patientName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {appt.appointmentDate} · {appt.appointmentTime} · {appt.consultationMode === 'video' ? 'Video' : 'Audio'}
                                        </p>
                                        {appt.symptoms && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">Note: {appt.symptoms}</p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {appt.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit) || 1}</span>
                        <button
                            disabled={page * limit >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
