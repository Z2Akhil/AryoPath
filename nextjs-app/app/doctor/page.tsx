'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDoctorAuth } from '@/providers/DoctorAuthProvider';
import { doctorApi } from '@/lib/api/doctorApi';
import { DoctorPortalAppointment } from '@/types/doctor';

export default function DoctorDashboard() {
    const { doctor } = useDoctorAuth();
    const [appointments, setAppointments] = useState<DoctorPortalAppointment[]>([]);
    const [todayCount, setTodayCount]     = useState(0);
    const [loading, setLoading]           = useState(true);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        Promise.all([
            doctorApi.getAppointments({ limit: 5 }),
            doctorApi.getAppointments({ date: today, limit: 50 }),
        ])
            .then(([upcoming, todayData]) => {
                setAppointments(upcoming.appointments);
                setTodayCount(todayData.total);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const statusColor: Record<string, string> = {
        pending:   'bg-yellow-100 text-yellow-700',
        confirmed: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Profile summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-5">
                {doctor?.profilePhoto?.url ? (
                    <img src={doctor.profilePhoto.url} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold">
                        {doctor?.name?.[0]}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{doctor?.name}</h1>
                    <p className="text-sm text-gray-500">{doctor?.specialization}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-3xl font-bold text-teal-600">{todayCount}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Today&apos;s appointments</p>
                </div>
            </div>

            {/* Upcoming appointments */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-800">Upcoming Appointments</h2>
                <Link href="/doctor/appointments" className="text-sm text-teal-600 hover:underline">View all</Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                    <p className="text-sm">No upcoming appointments.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {appointments.map(appt => (
                        <Link
                            key={appt._id}
                            href={`/doctor/appointments/${appt._id}`}
                            className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{appt.patientName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{appt.appointmentDate} · {appt.appointmentTime} · {appt.consultationMode}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {appt.status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
