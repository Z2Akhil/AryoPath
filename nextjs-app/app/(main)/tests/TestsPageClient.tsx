'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TestCard from '@/components/cards/TestCard';
import SkeletonTestCard from '@/components/skeletons/SkeletonTestCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

interface TestsPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

type SortKey = 'default' | 'name_asc' | 'price_asc' | 'price_desc';

export default function TestsPageClient({
    initialData,
    initialTotal,
    limit,
    showHeader = true,
    mobileScroll = false,
}: TestsPageClientProps) {
    const [tests, setTests]               = useState<Product[]>(initialData);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems]     = useState(initialTotal);
    const [search, setSearch]             = useState('');
    const [sort, setSort]                 = useState<SortKey>('default');
    const [searchResults, setSearchResults] = useState<Product[] | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isWidget    = !!limit;
    const isSearching = search.trim() !== '';

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!search.trim()) { setSearchResults(null); return; }
        setSearchLoading(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await getProductsFromBackend('TESTS', { search: search.trim() });
                setSearchResults(res.products);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [search]);

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('TESTS', { limit: itemsPerPage, skip });
            setTests(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setSearch('');
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('TESTS', { limit: newLimit, skip: 0 });
            setTests(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setSearch('');
            setError(null);
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const displayed = useMemo(() => {
        let out = isSearching ? (searchResults ?? []) : [...tests];
        if (sort === 'name_asc')   out.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'price_asc')  out.sort((a, b) => getProductDisplayPrice(a).originalPrice - getProductDisplayPrice(b).originalPrice);
        if (sort === 'price_desc') out.sort((a, b) => getProductDisplayPrice(b).originalPrice - getProductDisplayPrice(a).originalPrice);
        return out;
    }, [tests, searchResults, isSearching, sort]);

    const totalPages   = Math.ceil(totalItems / itemsPerPage);
    const showSkeleton = loading || (isSearching && searchLoading);

    /* ── Widget / home page embed ─────────────────────────────── */
    if (isWidget) {
        return (
            <div className="px-4">
                <div className={
                    mobileScroll
                        ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0'
                        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
                }>
                    {tests.map((t) => (
                        <div key={t.code} className={mobileScroll ? 'shrink-0 w-52 md:w-auto' : undefined}>
                            <TestCard test={t} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Full page ────────────────────────────────────────────── */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

            {/* Page header */}
            {showHeader && (
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
                        Lab Tests &amp; Diagnostics
                    </h1>
                    <p className="text-sm text-gray-500 max-w-2xl">
                        Book individual blood tests online with free home sample collection. NABL accredited labs, digital reports in 24–48 hrs.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {totalItems.toLocaleString()} tests available
                    </div>
                </div>
            )}

            {/* Search + sort */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tests (e.g. thyroid, CBC, vitamin D…)"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-44"
                >
                    <option value="default">Default order</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* Search results label */}
            {isSearching && !searchLoading && !loading && (
                <p className="text-sm text-gray-500 mb-4">
                    {displayed.length === 0
                        ? `No results for "${search}"`
                        : `${displayed.length} result${displayed.length !== 1 ? 's' : ''} for "${search}"`}
                </p>
            )}

            {error && (
                <div className="mb-4 py-3 px-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {showSkeleton
                    ? Array.from({ length: itemsPerPage }).map((_, i) => (
                          <SkeletonTestCard key={i} />
                      ))
                    : displayed.length > 0
                    ? displayed.map((test) => (
                          <TestCard key={test.code} test={test} />
                      ))
                    : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm font-medium">
                                {isSearching ? `No tests found for "${search}"` : 'No tests available'}
                            </p>
                            {isSearching && (
                                <button
                                    onClick={() => { setSearch(''); setSearchResults(null); }}
                                    className="mt-2 text-sm text-blue-500 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
            </div>

            {/* Pagination */}
            {!isSearching && totalItems > itemsPerPage && totalPages > 1 && (
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        totalItems={totalItems}
                    />
                </div>
            )}
        </div>
    );
}
