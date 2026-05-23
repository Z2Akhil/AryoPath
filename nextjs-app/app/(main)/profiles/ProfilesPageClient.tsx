'use client';

import { useMemo, useState } from 'react';
import ProfileCard from '@/components/cards/ProfileCard';
import SkeletonProfileCard from '@/components/skeletons/SkeletonProfileCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

type SortKey = 'default' | 'name_asc' | 'price_asc' | 'price_desc' | 'tests_desc';

interface ProfilesPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default function ProfilesPageClient({
    initialData,
    initialTotal,
    limit,
    showHeader = true,
    mobileScroll = false,
}: ProfilesPageClientProps) {
    const [packages, setPackages]           = useState<Product[]>(initialData);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [currentPage, setCurrentPage]     = useState(1);
    const [itemsPerPage, setItemsPerPage]   = useState(12);
    const [totalItems, setTotalItems]       = useState(initialTotal);
    const [search, setSearch]               = useState('');
    const [sort, setSort]                   = useState<SortKey>('default');
    const [activeCategory, setActiveCategory] = useState('All');

    const isWidget = !!limit;

    const categories = useMemo(() => {
        const cats = new Set<string>();
        packages.forEach((p) => { if (p.category) cats.add(p.category as string); });
        return ['All', ...Array.from(cats).sort()];
    }, [packages]);

    const displayed = useMemo(() => {
        let out = [...packages];
        if (activeCategory !== 'All') out = out.filter((p) => (p.category as string) === activeCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter((p) => p.name?.toLowerCase().includes(q));
        }
        if (sort === 'name_asc')   out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (sort === 'price_asc')  out.sort((a, b) => getProductDisplayPrice(a).displayPrice - getProductDisplayPrice(b).displayPrice);
        if (sort === 'price_desc') out.sort((a, b) => getProductDisplayPrice(b).displayPrice - getProductDisplayPrice(a).displayPrice);
        if (sort === 'tests_desc') out.sort((a, b) => (b.testCount || 0) - (a.testCount || 0));
        return out;
    }, [packages, search, sort, activeCategory]);

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('PROFILE', { limit: itemsPerPage, skip });
            setPackages(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setSearch('');
            setActiveCategory('All');
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            setError('Failed to load packages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('PROFILE', { limit: newLimit, skip: 0 });
            setPackages(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setSearch('');
            setActiveCategory('All');
            setError(null);
        } catch {
            setError('Failed to load packages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => { setSearch(''); setActiveCategory('All'); };
    const isFiltering  = search.trim() !== '' || activeCategory !== 'All';
    const totalPages   = Math.ceil(totalItems / itemsPerPage);

    /* ── Widget / home page embed ─────────────────────────────── */
    if (isWidget) {
        return (
            <div className="px-4">
                <div className={
                    mobileScroll
                        ? 'flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:pb-0'
                        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                }>
                    {packages.map((pkg) => (
                        <div key={pkg.code} className={mobileScroll ? 'shrink-0 w-64 md:w-auto' : undefined}>
                            <ProfileCard pkg={pkg} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Full page ────────────────────────────────────────────── */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

            {/* Header */}
            {showHeader && (
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
                        Health Checkup Packages
                    </h1>
                    <p className="text-sm text-gray-500 max-w-2xl">
                        Book Thyrocare health checkup profiles online with free home sample collection.
                        NABL &amp; CAP accredited labs, digital reports in 24–48 hrs.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {totalItems.toLocaleString()} packages available
                    </div>
                </div>
            )}

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search packages (e.g. Aarogyam, thyroid, diabetes…)"
                        className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
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
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-52"
                >
                    <option value="default">Most Popular</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="tests_desc">Most Tests First</option>
                </select>
            </div>

            {/* Category pills — horizontal scroll on mobile */}
            {categories.length > 2 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                activeCategory === cat
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Filter result count */}
            {isFiltering && !loading && (
                <p className="text-sm text-gray-500 mb-4">
                    {displayed.length === 0
                        ? 'No packages match your filters'
                        : `${displayed.length} package${displayed.length !== 1 ? 's' : ''} found`}
                    <button onClick={clearFilters} className="ml-2 text-blue-500 hover:underline">
                        Clear filters
                    </button>
                </p>
            )}

            {error && (
                <div className="mb-4 py-3 px-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonProfileCard key={i} />)
                    : displayed.length > 0
                    ? displayed.map((pkg) => <ProfileCard key={pkg.code} pkg={pkg} />)
                    : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">
                                {isFiltering ? 'No packages match your filters' : 'No packages available'}
                            </p>
                            {isFiltering && (
                                <button onClick={clearFilters} className="mt-2 text-sm text-blue-500 hover:underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
            </div>

            {/* Pagination — hidden while filtering */}
            {!isFiltering && totalItems > itemsPerPage && totalPages > 1 && (
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
