'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { adminStaffApi } from '@/lib/api/adminStaffApi';
import { useToast } from '@/providers/ToastProvider';
import { PERMISSION_GROUPS, Permission, FULL_ACCESS_SECTIONS } from '@/lib/constants/permissions';
import { StaffProfile } from '@/types/staff';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';

export default function EditStaffPage() {
    const { isAdmin } = useAdminAuth();
    const router  = useRouter();
    const toast   = useToast();
    const { id }  = useParams<{ id: string }>();

    const [staff, setStaff]         = useState<StaffProfile | null>(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [resetting, setResetting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', mobile: '', isActive: true });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError]     = useState('');

    useEffect(() => {
        adminStaffApi.getById(id)
            .then(data => {
                setStaff(data.staff);
                setForm({ name: data.staff.name, email: data.staff.email, mobile: data.staff.mobile, isActive: data.staff.isActive });
                setPermissions(data.staff.permissions);
            })
            .catch(() => toast.error('Failed to load staff'))
            .finally(() => setLoading(false));
    }, [id]);

    const togglePermission = (perm: Permission, isEditPerm: boolean, viewPerm?: Permission) => {
        setPermissions(prev => {
            if (prev.includes(perm)) {
                const next = prev.filter(p => p !== perm);
                if (!isEditPerm && viewPerm) return next.filter(p => p !== viewPerm);
                return next;
            } else {
                const next = [...prev, perm];
                if (isEditPerm && viewPerm && !prev.includes(viewPerm)) return [...next, viewPerm];
                return next;
            }
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await adminStaffApi.update(id, { ...form, permissions });
            toast.success('Staff updated');
            router.push('/admin/staff');
        } catch {
            toast.error('Failed to update staff');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
        setResetting(true);
        try {
            await adminStaffApi.resetPassword(id, newPassword);
            toast.success('Password reset');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast.error('Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!staff) return <div className="p-6 text-gray-500 text-sm">Staff not found.</div>;

    if (!isAdmin) return <AccessDenied section="Staff Management" />;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Edit Staff</h1>
                <p className="text-sm text-gray-500 mt-0.5">@{staff.username}</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Basic Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Full Name', field: 'name',   type: 'text',  placeholder: '' },
                            { label: 'Email',     field: 'email',  type: 'email', placeholder: '' },
                            { label: 'Mobile',    field: 'mobile', type: 'tel',   placeholder: '' },
                        ].map(({ label, field, type }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                <input
                                    type={type}
                                    value={(form as any)[field]}
                                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        <div className="flex items-center gap-3 pt-5">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={form.isActive}
                                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Permissions</h2>
                    <div className="space-y-1">
                        {PERMISSION_GROUPS.map(group => {
                            const isFull = FULL_ACCESS_SECTIONS.has(group.label);
                            const groupPerms = group.permissions as readonly Permission[];
                            const viewPerm = groupPerms[0];
                            // Single-perm groups (Users, Homepage, Notifications, Services) also treated as full-access
                            const editPerm = (!isFull && groupPerms.length > 1) ? groupPerms[1] : undefined;
                            const isSingleAccess = isFull || groupPerms.length === 1;

                            if (isSingleAccess) {
                                const hasAccess = groupPerms.some(p => permissions.includes(p));
                                return (
                                    <div key={group.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
                                        <div>
                                            <p className="text-sm text-gray-700 font-medium">{group.label}</p>
                                            {'description' in group && (
                                                <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                                            )}
                                        </div>
                                        <label className="flex items-center gap-2 shrink-0 ml-4 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasAccess}
                                                onChange={() => setPermissions(prev =>
                                                    hasAccess
                                                        ? prev.filter(p => !groupPerms.includes(p))
                                                        : [...new Set([...prev, ...groupPerms])]
                                                )}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-xs text-gray-500">Full Access</span>
                                        </label>
                                    </div>
                                );
                            }

                            return (
                                <div key={group.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="text-sm text-gray-700 font-medium">{group.label}</p>
                                        {'description' in group && (
                                            <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 ml-4">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions.includes(viewPerm)}
                                                onChange={() => togglePermission(viewPerm, false, editPerm)}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-xs text-gray-500">View</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions.includes(editPerm!)}
                                                onChange={() => togglePermission(editPerm!, true, viewPerm)}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span className="text-xs text-gray-500">Edit</span>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.push('/admin/staff')} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </form>

            {/* Reset password */}
            <form onSubmit={handleResetPassword} className="mt-6 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Reset Password</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Min 8 characters"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwError ? 'border-red-400' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwError ? 'border-red-400' : 'border-gray-300'}`}
                        />
                    </div>
                </div>
                {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                <button type="submit" disabled={resetting} className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-60">
                    {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}
