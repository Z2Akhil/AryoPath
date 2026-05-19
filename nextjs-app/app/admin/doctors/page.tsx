'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Stethoscope, Edit2, Trash2, Eye, EyeOff,
  ShieldCheck, Star, Wifi, WifiOff, ChevronLeft, ChevronRight,
  Video, Phone, Loader2, AlertCircle, User,
} from 'lucide-react';
import adminDoctorApi from '@/lib/api/adminDoctorApi';
import { useToast } from '@/providers/ToastProvider';
import { Doctor } from '@/types/doctor';

const MODE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-3 w-3" />,
  audio: <Phone className="h-3 w-3" />,
};

export default function DoctorsListPage() {
  const toast = useToast();

  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterPublished, setFilterPublished] = useState<'' | 'true' | 'false'>('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [deletingId, setDeletingId] = useState('');
  const [togglingId, setTogglingId] = useState('');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminDoctorApi.list({
        page,
        limit: 15,
        search: search.trim() || undefined,
        isPublished: filterPublished === '' ? '' : filterPublished === 'true',
      });
      setDoctors(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterPublished]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterPublished]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminDoctorApi.delete(id);
      toast.success('Doctor deleted');
      fetchDoctors();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId('');
    }
  };

  const handleTogglePublish = async (doctor: Doctor) => {
    setTogglingId(doctor._id);
    try {
      await adminDoctorApi.togglePublish(doctor._id, !doctor.isPublished);
      toast.success(doctor.isPublished ? 'Moved to draft' : 'Published!');
      fetchDoctors();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-100 mb-2">
            <Stethoscope className="h-3 w-3" /> Doctor Management
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} doctor{total !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          href="/admin/doctors/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Doctor
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <select
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-700">No doctors found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Try a different search term' : 'Add your first doctor to get started'}
              </p>
            </div>
            {!search && (
              <Link
                href="/admin/doctors/add"
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all text-sm"
              >
                <Plus className="h-4 w-4" /> Add Doctor
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Doctor', 'Specialization', 'Fee', 'Modes', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Doctor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {doc.profilePhoto?.url ? (
                            <img src={doc.profilePhoto.url} alt={doc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-teal-600">
                              {doc.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.experience > 0 ? `${doc.experience} yrs exp` : ''}</p>
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg">
                        {doc.specialization || '—'}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">₹{doc.consultationFee}</p>
                      {doc.followUpFee > 0 && (
                        <p className="text-xs text-gray-400">Follow-up ₹{doc.followUpFee}</p>
                      )}
                    </td>

                    {/* Modes */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        {(doc.consultationModes ?? []).map((m) => (
                          <span
                            key={m}
                            title={m}
                            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg"
                          >
                            {MODE_ICONS[m]}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${doc.isPublished ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                          {doc.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {doc.isVerified && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[11px] font-bold">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        {doc.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${doc.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                          {doc.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                          {doc.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                        {/* Toggle publish */}
                        <button
                          onClick={() => handleTogglePublish(doc)}
                          disabled={togglingId === doc._id}
                          title={doc.isPublished ? 'Unpublish' : 'Publish'}
                          className="p-2 rounded-lg hover:bg-teal-50 text-gray-400 hover:text-teal-600 transition-colors disabled:opacity-40"
                        >
                          {togglingId === doc._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : doc.isPublished ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                        {/* Edit */}
                        <Link
                          href={`/admin/doctors/${doc._id}/edit`}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(doc._id, doc.name)}
                          disabled={deletingId === doc._id}
                          title="Delete"
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          {deletingId === doc._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
