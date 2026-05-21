'use client';

import React, { useEffect, useState } from 'react';
import { doctorApi } from '@/lib/api/doctorApi';

export default function DoctorProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        doctorApi.getProfile()
            .then(data => setProfile(data.doctor))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-6 text-gray-500 text-sm">Failed to load profile.</div>;
    }

    const rows = [
        { label: 'Name',          value: profile.name },
        { label: 'Specialization',value: profile.specialization },
        { label: 'Experience',    value: profile.experience ? `${profile.experience} years` : '—' },
        { label: 'Qualifications',value: profile.qualifications?.join(', ') || '—' },
        { label: 'Registration',  value: profile.registrationNumber || '—' },
        { label: 'Medical Council',value: profile.medicalCouncil || '—' },
        { label: 'Languages',     value: profile.languages?.join(', ') || '—' },
        { label: 'Consultation Fee', value: profile.consultationFee ? `₹${profile.consultationFee}` : '—' },
        { label: 'Modes',         value: profile.consultationModes?.join(', ') || '—' },
        { label: 'Email',         value: profile.email || '—' },
        { label: 'Mobile',        value: profile.mobile || '—' },
    ];

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-5 mb-8">
                {profile.profilePhoto?.url ? (
                    <img src={profile.profilePhoto.url} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-2 border-teal-200" />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-3xl font-bold">
                        {profile.name?.[0]}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                    <p className="text-sm text-gray-500">{profile.specialization}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {rows.map(row => (
                    <div key={row.label} className="flex px-5 py-3.5">
                        <span className="w-44 text-sm font-medium text-gray-500 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-900">{row.value}</span>
                    </div>
                ))}
            </div>

            {profile.shortBio && (
                <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-medium text-gray-500 mb-2">Bio</p>
                    <p className="text-sm text-gray-800">{profile.shortBio}</p>
                </div>
            )}
        </div>
    );
}
