'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Pill, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import medicineApi from '@/lib/api/medicineApi';
import { Medicine } from '@/types/medicine';
import MedicineCard from '@/components/medicines/MedicineCard';
import SkeletonMedicineCard from '@/components/medicines/SkeletonMedicineCard';
import MedicineSearchBar from '@/components/medicines/MedicineSearchBar';
import MedicineFilters, { FilterState } from '@/components/medicines/MedicineFilters';
import TrustBadges from '@/components/medicines/TrustBadges';
const INITIAL_FILTERS: FilterState = {
  category: '', type: '', rxOnly: '', inStock: false, hasDiscount: false, minPrice: '', maxPrice: '',
};

export default function MedicinesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/50">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Order Medicines Online</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonMedicineCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <MedicinesContent />
    </Suspense>
  );
}

function MedicinesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicineApi.list({
        page,
        limit: 20,
        search: search || undefined,
        category: filters.category || undefined,
        type: filters.type || undefined,
        rxOnly: filters.rxOnly !== '' ? (filters.rxOnly as any) : undefined,
        inStock: filters.inStock || undefined,
        hasDiscount: filters.hasDiscount || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      });
      setMedicines(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  // Reset page when filters or search change
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (q) router.replace(`/medicines?search=${encodeURIComponent(q)}`, { scroll: false });
    else router.replace('/medicines', { scroll: false });
  };

  const handleFiltersChange = (f: FilterState) => setFilters(f);
  const handleFiltersReset  = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="min-h-screen bg-gray-50/50">
        {/* Hero search bar */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Pill className="h-5 w-5 text-teal-200" />
              <span className="text-teal-200 text-sm font-semibold uppercase tracking-widest">Medicine Store</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Order Medicines Online</h1>
            <p className="text-teal-100 text-sm mb-8">Genuine medicines · Fast delivery · Licensed pharmacy</p>
            <MedicineSearchBar defaultValue={search} onSearch={handleSearch} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile filter toggle + result count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : <><span className="font-bold text-gray-900">{total}</span> medicines found</>}
            </p>
            <button
              onClick={() => setShowFilterDrawer(v => !v)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>

          <div className="flex gap-8 items-start">
            {/* Sidebar — desktop always visible, mobile via drawer */}
            <aside className={`
              w-72 flex-shrink-0
              lg:block
              ${showFilterDrawer ? 'fixed inset-0 z-40 lg:static lg:z-auto' : 'hidden lg:block'}
            `}>
              {showFilterDrawer && (
                <div className="fixed inset-0 bg-black/40 lg:hidden" onClick={() => setShowFilterDrawer(false)} />
              )}
              <div className={`
                ${showFilterDrawer ? 'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl lg:static lg:max-h-none lg:rounded-2xl' : ''}
                lg:sticky lg:top-8
              `}>
                <MedicineFilters
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleFiltersReset}
                  isOpen={true}
                  onClose={() => setShowFilterDrawer(false)}
                />
              </div>
            </aside>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonMedicineCard key={i} />)}
                </div>
              ) : medicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-700">No medicines found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {search ? 'Try a different search term or remove filters' : 'No medicines match your filters'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSearch(''); handleFiltersReset(); }}
                    className="text-sm font-bold text-teal-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {medicines.map(med => <MedicineCard key={med._id || med.slug} medicine={med} />)}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </button>
                      {(() => {
                        const window = 2;
                        const start = Math.max(1, page - window);
                        const end = Math.min(totalPages, page + window);
                        const pages: (number | '...')[] = [];
                        if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                        for (let i = start; i <= end; i++) pages.push(i);
                        if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
                        return pages.map((p, i) =>
                          p === '...'
                            ? <span key={`ellipsis-${i}`} className="px-2 py-2 text-gray-400 text-sm">…</span>
                            : <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                className={`min-w-[36px] px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                                  page === p
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >{p}</button>
                        );
                      })()}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Trust badges */}
              <div className="mt-12">
                <TrustBadges />
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
