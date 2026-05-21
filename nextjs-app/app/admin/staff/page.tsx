'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react';
import { adminStaffApi } from '@/lib/api/adminStaffApi';
import { useToast } from '@/providers/ToastProvider';
import { StaffProfile } from '@/types/staff';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import AccessDenied from '@/components/admin/AccessDenied';

export default function AdminStaffPage() {
    const { isAdmin } = useAdminAuth();
    const toast = useToast();
    const [staff, setStaff]       = useState<StaffProfile[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');
    const [page, setPage]         = useState(1);
    const [total, setTotal]       = useState(0);
    const [deletingId, setDeletingId] = useState('');
    const limit = 20;

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await adminStaffApi.list({ page, limit });
            setStaff(res.staff);
            setTotal(res.total);
        } catch {
            setError('Failed to load staff');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete staff member "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await adminStaffApi.delete(id);
            toast.success('Staff deleted');
            fetchStaff();
        } catch {
            toast.error('Failed to delete staff');
        } finally {
            setDeletingId('');
        }
    };

    const handleToggleActive = async (member: StaffProfile) => {
        try {
            await adminStaffApi.update(member._id, { isActive: !member.isActive });
            toast.success(`Staff ${member.isActive ? 'deactivated' : 'activated'}`);
            fetchStaff();
        } catch {
            toast.error('Failed to update staff');
        }
    };

    const filtered = search.trim()
        ? staff.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.username.toLowerCase().includes(search.toLowerCase())
        )
        : staff;

    const totalPages = Math.ceil(total / limit);

    if (!isAdmin) {
        return <AccessDenied section="Staff Management" />;
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{total} staff member{total !== 1 ? 's' : ''}</p>
                </div>
                <Link
                    href="/admin/staff/add"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-sm pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                </div>
            ) : error ? (
                <div className="text-red-500 text-sm py-8 text-center">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                    <p className="text-sm">{search ? 'No matching staff found.' : 'No staff members yet. Create one to get started.'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(member => (
                                <tr key={member._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-400">@{member.username}</p>
                                        <p className="text-xs text-gray-400">{member.email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                            {member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''}
                                        </span>
                                        {member.permissions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                                                {member.permissions.slice(0, 3).map(p => (
                                                    <span key={p} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p}</span>
                                                ))}
                                                {member.permissions.length > 3 && (
                                                    <span className="text-xs text-gray-400">+{member.permissions.length - 3} more</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {member.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(member)}
                                                title={member.isActive ? 'Deactivate' : 'Activate'}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                            >
                                                {member.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                            </button>
                                            <Link
                                                href={`/admin/staff/${member._id}/edit`}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(member._id, member.name)}
                                                disabled={deletingId === member._id}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === member._id
                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                    : <Trash2 className="w-4 h-4" />
                                                }
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">← Previous</button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">Next →</button>
                </div>
            )}
        </div>
    );
}
