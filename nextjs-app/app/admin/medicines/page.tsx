'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, Trash2, Pencil, Globe, EyeOff,
  Package, AlertTriangle, RefreshCw, Loader2, ImageIcon,
} from 'lucide-react';
import adminMedicineApi from '@/lib/api/adminMedicineApi';
import { Medicine, MEDICINE_TYPES } from '@/types/medicine';
import { useToast } from '@/providers/ToastProvider';
import { useAdminAuth } from '@/providers/AdminAuthProvider';
import { PERMISSIONS } from '@/lib/constants/permissions';
import AccessDenied from '@/components/admin/AccessDenied';

const TYPE_COLORS: Record<string, string> = {
  tablet: 'bg-blue-50 text-blue-700',
  capsule: 'bg-purple-50 text-purple-700',
  syrup: 'bg-pink-50 text-pink-700',
  injection: 'bg-red-50 text-red-700',
  cream: 'bg-yellow-50 text-yellow-700',
  ointment: 'bg-orange-50 text-orange-700',
  drops: 'bg-teal-50 text-teal-700',
  powder: 'bg-gray-50 text-gray-700',
};

export default function MedicinesPage() {
  const { isAdmin, hasPermission } = useAdminAuth();
  const { success, error: toastError } = useToast();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMedicineApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        type: typeFilter || undefined,
        isPublished: statusFilter === '' ? '' : statusFilter === 'true',
      });
      setMedicines(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      toastError('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminMedicineApi.delete(id);
      success('Medicine deleted successfully');
      fetchMedicines();
    } catch {
      toastError('Failed to delete medicine');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await adminMedicineApi.togglePublish(id, !current);
      setMedicines((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isPublished: !current, isDraft: current } : m))
      );
      success(current ? 'Medicine unpublished' : 'Medicine published');
    } catch {
      toastError('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  if (!isAdmin && !hasPermission(PERMISSIONS.MEDICINES_VIEW)) {
    return <AccessDenied section="Medicines" />;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Medicines</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} medicine{total !== 1 ? 's' : ''} in catalogue
          </p>
        </div>
        <Link
          href="/admin/medicines/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Medicine
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 capitalize"
          >
            <option value="">All Types</option>
            {MEDICINE_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
          <button
            type="button"
            onClick={() => fetchMedicines()}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-semibold">No medicines found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || typeFilter || statusFilter ? 'Try adjusting your filters' : 'Start by adding your first medicine'}
            </p>
            {!search && !typeFilter && !statusFilter && (
              <Link href="/admin/medicines/add" className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Add Medicine
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Medicine</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">MRP</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medicines.map((med) => (
                  <tr key={med._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                          {med.thumbnail?.url ? (
                            <img src={med.thumbnail.url} alt={med.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{med.name}</p>
                          {med.sku && <p className="text-xs text-gray-400 font-mono">{med.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${TYPE_COLORS[med.type] ?? 'bg-gray-50 text-gray-600'}`}>
                        {med.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-gray-400 line-through">₹{med.mrp?.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div>
                        <span className="text-sm font-bold text-gray-900">₹{med.offerPrice?.toFixed(2)}</span>
                        {med.discountPercentage > 0 && (
                          <span className="ml-1.5 text-xs font-semibold text-green-600">{med.discountPercentage}% off</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                          med.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {med.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        {med.inStock && (
                          <span className={`text-xs mt-0.5 font-medium ${
                            med.stockQuantity <= (10) ? 'text-amber-500' : 'text-gray-400'
                          }`}>
                            {med.stockQuantity <= 10 && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                            {med.stockQuantity} units
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        med.isPublished ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {med.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/medicines/${med._id}/edit`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(med._id, med.isPublished)}
                          disabled={togglingId === med._id}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title={med.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {togglingId === med._id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : med.isPublished
                            ? <EyeOff className="h-4 w-4" />
                            : <Globe className="h-4 w-4" />
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(med._id, med.name)}
                          disabled={deletingId === med._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === med._id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-gray-500 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
