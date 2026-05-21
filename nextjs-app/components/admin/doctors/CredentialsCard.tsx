'use client';

import React, { useState } from 'react';
import { adminDoctorCredentialsApi } from '@/lib/api/adminDoctorCredentialsApi';
import { useToast } from '@/providers/ToastProvider';

interface Props {
    doctorId: string;
    hasLogin: boolean;
    loginUsername: string;
}

export default function CredentialsCard({ doctorId, hasLogin: initialHasLogin, loginUsername: initialUsername }: Props) {
    const toast = useToast();
    const [hasLogin, setHasLogin]         = useState(initialHasLogin);
    const [loginUsername, setLoginUsername] = useState(initialUsername);

    const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
    const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });
    const [showSetForm, setShowSetForm]     = useState(false);
    const [showResetForm, setShowResetForm] = useState(false);
    const [saving, setSaving]   = useState(false);
    const [removing, setRemoving] = useState(false);
    const [error, setError]     = useState('');

    const handleSet = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.username.trim()) { setError('Username is required'); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

        setSaving(true);
        try {
            const res = await adminDoctorCredentialsApi.setCredentials(doctorId, { username: form.username, password: form.password });
            setHasLogin(true);
            setLoginUsername(res.loginUsername);
            setForm({ username: '', password: '', confirmPassword: '' });
            setShowSetForm(false);
            toast.success('Login credentials set');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to set credentials');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (resetForm.password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (resetForm.password !== resetForm.confirmPassword) { setError('Passwords do not match'); return; }

        setSaving(true);
        try {
            await adminDoctorCredentialsApi.setCredentials(doctorId, { username: loginUsername, password: resetForm.password });
            setResetForm({ password: '', confirmPassword: '' });
            setShowResetForm(false);
            toast.success('Password reset');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to reset password');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remove login access for this doctor? They will no longer be able to log in.')) return;
        setRemoving(true);
        try {
            await adminDoctorCredentialsApi.removeCredentials(doctorId);
            setHasLogin(false);
            setLoginUsername('');
            setShowResetForm(false);
            toast.success('Login access removed');
        } catch {
            toast.error('Failed to remove login access');
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Doctor Portal Login</h2>
            <p className="text-sm text-gray-500 mb-5">
                {hasLogin ? 'This doctor has login access to the Doctor Portal.' : 'Grant this doctor access to the Doctor Portal.'}
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            {!hasLogin ? (
                <>
                    {!showSetForm ? (
                        <button
                            onClick={() => setShowSetForm(true)}
                            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Set Login Credentials
                        </button>
                    ) : (
                        <form onSubmit={handleSet} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        placeholder="e.g. dr.smith"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                        placeholder="Min 8 characters"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                        placeholder="Re-enter"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowSetForm(false); setError(''); }} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-60">{saving ? 'Setting...' : 'Set Credentials'}</button>
                            </div>
                        </form>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <div>
                            <p className="text-xs text-teal-600 font-medium">Login Username</p>
                            <p className="text-sm font-mono text-teal-900 mt-0.5">@{loginUsername}</p>
                        </div>
                        <span className="ml-auto text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">Active</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => { setShowResetForm(v => !v); setError(''); }}
                            className="px-4 py-2 border border-orange-300 text-orange-700 text-sm rounded-lg hover:bg-orange-50"
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={handleRemove}
                            disabled={removing}
                            className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 disabled:opacity-60"
                        >
                            {removing ? 'Removing...' : 'Remove Login'}
                        </button>
                    </div>

                    {showResetForm && (
                        <form onSubmit={handleReset} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={resetForm.password}
                                        onChange={e => setResetForm(p => ({ ...p, password: e.target.value }))}
                                        placeholder="Min 8 characters"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={resetForm.confirmPassword}
                                        onChange={e => setResetForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                        placeholder="Re-enter"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => { setShowResetForm(false); setError(''); }} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-60">{saving ? 'Resetting...' : 'Reset Password'}</button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
