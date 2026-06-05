'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminStaffApi } from '@/lib/api/adminStaffApi';
import { useToast } from '@/providers/ToastProvider';
import { PERMISSION_GROUPS, PERMISSIONS, Permission, FULL_ACCESS_SECTIONS } from '@/lib/constants/permissions';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';

export default function AddStaffPage() {
    const { isAdmin } = useAdminAuth();
    const router = useRouter();
    const toast  = useToast();

    const [form, setForm] = useState({
        name: '', username: '', email: '', mobile: '', password: '', confirmPassword: '',
    });
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [saving, setSaving]           = useState(false);
    const [errors, setErrors]           = useState<Record<string, string>>({});

    const setField = (field: string, value: string) =>
        setForm(p => ({ ...p, [field]: value }));

    const togglePermission = (perm: Permission, isEditPerm: boolean, viewPerm?: Permission) => {
        setPermissions(prev => {
            if (prev.includes(perm)) {
                const next = prev.filter(p => p !== perm);
                if (isEditPerm) return next;
                if (viewPerm) return next.filter(p => p !== viewPerm);
                return next;
            } else {
                const next = [...prev, perm];
                if (isEditPerm && viewPerm && !prev.includes(viewPerm)) return [...next, viewPerm];
                return next;
            }
        });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim())     e.name     = 'Name is required';
        if (!form.username.trim()) e.username  = 'Username is required';
        if (!form.email.trim())    e.email     = 'Email is required';
        if (!form.mobile.trim())   e.mobile    = 'Mobile is required';
        if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await adminStaffApi.create({
                name:     form.name.trim(),
                username: form.username.trim(),
                email:    form.email.trim(),
                mobile:   form.mobile.trim(),
                password: form.password,
                permissions,
            });
            toast.success('Staff member created');
            router.push('/admin/staff');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create staff');
        } finally {
            setSaving(false);
        }
    };

    if (!isAdmin) return <AccessDenied section="Staff Management" />;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Add Staff Member</h1>
                <p className="text-sm text-gray-500 mt-0.5">Create a new staff account and assign permissions.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic details */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Basic Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: 'Full Name', field: 'name', type: 'text', placeholder: 'John Doe' },
                            { label: 'Username', field: 'username', type: 'text', placeholder: 'johndoe' },
                            { label: 'Email', field: 'email', type: 'email', placeholder: 'john@example.com' },
                            { label: 'Mobile', field: 'mobile', type: 'tel', placeholder: '9876543210' },
                        ].map(({ label, field, type, placeholder }) => (
                            <div key={field}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                <input
                                    type={type}
                                    value={(form as any)[field]}
                                    onChange={e => setField(field, e.target.value)}
                                    placeholder={placeholder}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setField('password', e.target.value)}
                                placeholder="Min 8 characters"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={e => setField('confirmPassword', e.target.value)}
                                placeholder="Re-enter password"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {errors.confirmPassword && <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>}
                        </div>
                    </div>
                </div>

                {/* Permissions matrix */}
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
                    <button
                        type="button"
                        onClick={() => router.push('/admin/staff')}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {saving ? 'Creating...' : 'Create Staff'}
                    </button>
                </div>
            </form>
        </div>
    );
}
