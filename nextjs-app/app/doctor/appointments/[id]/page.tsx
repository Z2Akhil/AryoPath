'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doctorApi } from '@/lib/api/doctorApi';
import { DoctorPortalAppointment, PrescriptionMedicine } from '@/types/doctor';
import { Plus, Trash2, FileText, Download, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const statusColor: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const FREQUENCY_OPTIONS = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'Before meals', 'After meals', 'At bedtime', 'As needed (SOS)',
];

const emptyMed = (): PrescriptionMedicine => ({
    name: '', dose: '', frequency: '', duration: '', instructions: '',
});

export default function AppointmentDetailPage() {
    const { id }  = useParams<{ id: string }>();
    const router  = useRouter();
    const [appt, setAppt]         = useState<DoctorPortalAppointment | null>(null);
    const [loading, setLoading]   = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError]       = useState('');

    // Prescription form state
    const [rxOpen, setRxOpen]         = useState(false);
    const [rxMeds, setRxMeds]         = useState<PrescriptionMedicine[]>([emptyMed()]);
    const [rxNotes, setRxNotes]       = useState('');
    const [rxSaving, setRxSaving]     = useState(false);
    const [rxSaved, setRxSaved]       = useState(false);
    const [rxError, setRxError]       = useState('');

    useEffect(() => {
        doctorApi.getAppointment(id)
            .then(data => {
                setAppt(data.appointment);
                if (data.appointment.prescription) {
                    setRxMeds(data.appointment.prescription.medicines.length > 0
                        ? data.appointment.prescription.medicines
                        : [emptyMed()]);
                    setRxNotes(data.appointment.prescription.notes ?? '');
                }
            })
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

    // ── Prescription helpers ──────────────────────────────────────────────────
    const updateMed = (idx: number, field: keyof PrescriptionMedicine, val: string) => {
        setRxMeds(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
    };
    const addMed    = () => setRxMeds(prev => [...prev, emptyMed()]);
    const removeMed = (idx: number) => setRxMeds(prev => prev.filter((_, i) => i !== idx));

    const savePrescription = async () => {
        const validMeds = rxMeds.filter(m => m.name.trim());
        if (validMeds.length === 0) { setRxError('Add at least one medicine.'); return; }
        setRxSaving(true); setRxError('');
        try {
            const data = await doctorApi.savePrescription(id, { medicines: validMeds, notes: rxNotes });
            setAppt(data.appointment);
            setRxSaved(true);
            setTimeout(() => setRxSaved(false), 3000);
        } catch {
            setRxError('Failed to save prescription. Please try again.');
        } finally {
            setRxSaving(false);
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

    const hasPrescription = appt.prescription && appt.prescription.medicines.length > 0;

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
                ← Back to appointments
            </button>

            {/* Status + Meet */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Status</p>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {appt.status === 'pending' && (
                            <button
                                onClick={() => updateStatus('confirmed')}
                                disabled={updating}
                                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                        )}
                        {appt.status === 'confirmed' && (
                            <button
                                onClick={() => updateStatus('completed')}
                                disabled={updating}
                                className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Completed'}
                            </button>
                        )}
                        {(appt.status === 'pending' || appt.status === 'confirmed') && (
                            <button
                                onClick={() => updateStatus('cancelled')}
                                disabled={updating}
                                className="text-sm px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                                Cancel
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
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
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
                            <p className="text-sm text-gray-900 mt-0.5 capitalize">{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Appointment details */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
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
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2">Patient Notes / Symptoms</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.symptoms}</p>
                </div>
            )}

            {/* Report files */}
            {appt.reportUrls?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">
                        Uploaded Reports ({appt.reportUrls.length})
                    </h2>
                    <div className="space-y-2">
                        {appt.reportUrls.map((file, i) => (
                            <div key={file.publicId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
                                <span className="text-sm text-gray-700 flex-1">Report {i + 1}</span>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 px-3 py-1.5 bg-teal-50 rounded-lg border border-teal-100 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    View / Download
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Digital Prescription ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                {/* Header — toggles the form */}
                <button
                    type="button"
                    onClick={() => setRxOpen(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        <span className="text-sm font-semibold text-gray-800">
                            Digital Prescription
                            {hasPrescription && (
                                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    Issued
                                </span>
                            )}
                        </span>
                    </div>
                    {rxOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {rxOpen && (
                    <div className="px-5 pb-5 border-t border-gray-100">

                        {/* Already-saved banner */}
                        {hasPrescription && (
                            <div className="mt-4 mb-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-xs text-green-700 font-medium">
                                    Prescription saved on {new Date(appt.prescription!.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
                                    You can update it below.
                                </p>
                            </div>
                        )}

                        {/* Medicine rows */}
                        <div className="mt-4 space-y-3">
                            {rxMeds.map((med, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 relative bg-gray-50/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Medicine {idx + 1}</span>
                                        {rxMeds.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMed(idx)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Medicine name */}
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Medicine Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Paracetamol 500mg"
                                                value={med.name}
                                                onChange={e => updateMed(idx, 'name', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                            />
                                        </div>

                                        {/* Dose */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Dose</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 1 tablet, 5ml"
                                                value={med.dose}
                                                onChange={e => updateMed(idx, 'dose', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                            />
                                        </div>

                                        {/* Frequency */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Frequency</label>
                                            <select
                                                value={med.frequency}
                                                onChange={e => updateMed(idx, 'frequency', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                            >
                                                <option value="">Select frequency</option>
                                                {FREQUENCY_OPTIONS.map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 5 days, 2 weeks"
                                                value={med.duration}
                                                onChange={e => updateMed(idx, 'duration', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                            />
                                        </div>

                                        {/* Instructions */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Special Instructions</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Take with food, Avoid milk"
                                                value={med.instructions}
                                                onChange={e => updateMed(idx, 'instructions', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add medicine */}
                        <button
                            type="button"
                            onClick={addMed}
                            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add another medicine
                        </button>

                        {/* Doctor's notes */}
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Doctor's Notes / Advice
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Follow-up in 7 days. Drink plenty of fluids. Avoid spicy food..."
                                value={rxNotes}
                                onChange={e => setRxNotes(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white resize-none"
                            />
                        </div>

                        {rxError && (
                            <p className="mt-2 text-xs text-red-500 font-medium">{rxError}</p>
                        )}

                        {/* Issue */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-blue-800">
                                    {hasPrescription ? 'Update & Re-issue Prescription' : 'Issue Prescription to Patient'}
                                </p>
                                <p className="text-[11px] text-blue-600 mt-0.5">
                                    {hasPrescription
                                        ? 'The patient will immediately see the updated prescription in their account.'
                                        : 'Once issued, the patient can view and download this prescription from their account.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={savePrescription}
                                disabled={rxSaving}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
                            >
                                {rxSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</>
                                ) : rxSaved ? (
                                    <><CheckCircle className="w-4 h-4" /> Issued!</>
                                ) : hasPrescription ? (
                                    'Update Prescription'
                                ) : (
                                    'Issue Prescription'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
