'use client';

import { useMemo, useState } from 'react';
import OfferCard from '@/components/cards/OfferCard';
import SkeletonOfferCard from '@/components/skeletons/SkeletonOfferCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

interface OffersPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

type SortKey = 'default' | 'discount_desc' | 'price_asc' | 'price_desc' | 'name_asc';

export default function OffersPageClient({
    initialData,
    initialTotal,
    limit,
    showHeader = true,
    mobileScroll = false,
}: OffersPageClientProps) {
    const [offers, setOffers]             = useState<Product[]>(initialData);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems]     = useState(initialTotal);
    const [search, setSearch]             = useState('');
    const [sort, setSort]                 = useState<SortKey>('default');

    const isWidget = !!limit;

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('OFFER', { limit: itemsPerPage, skip });
            setOffers(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setSearch('');
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching offers:', err);
            setError('Failed to load offers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('OFFER', { limit: newLimit, skip: 0 });
            setOffers(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setSearch('');
            setError(null);
        } catch (err) {
            console.error('Error fetching offers:', err);
            setError('Failed to load offers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const displayed = useMemo(() => {
        let out = search.trim()
            ? offers.filter((o) =>
                  o.name.toLowerCase().includes(search.toLowerCase())
              )
            : [...offers];

        if (sort === 'name_asc')      out.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'price_asc')     out.sort((a, b) => getProductDisplayPrice(a).originalPrice - getProductDisplayPrice(b).originalPrice);
        if (sort === 'price_desc')    out.sort((a, b) => getProductDisplayPrice(b).originalPrice - getProductDisplayPrice(a).originalPrice);
        if (sort === 'discount_desc') out.sort((a, b) => getProductDisplayPrice(b).discountPercentage - getProductDisplayPrice(a).discountPercentage);

        return out;
    }, [offers, search, sort]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    /* ── Widget / home page embed ─────────────────────────────── */
    if (isWidget) {
        return (
            <div className="px-4">
                <div className={
                    mobileScroll
                        ? 'flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible md:pb-0'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                }>
                    {offers.map((o) => (
                        <div key={o.code} className={mobileScroll ? 'shrink-0 w-72 md:w-auto' : undefined}>
                            <OfferCard pkg={o} />
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
                        Offers &amp; Discounts
                    </h1>
                    <p className="text-sm text-gray-500 max-w-2xl">
                        Exclusive discounts on Thyrocare health packages. Free home sample collection and digital reports.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {totalItems.toLocaleString()} active offers
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
                        placeholder="Search offers by name…"
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
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-52"
                >
                    <option value="default">Default order</option>
                    <option value="discount_desc">Highest Discount First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name A–Z</option>
                </select>
            </div>

            {/* Search results label */}
            {search && !loading && (
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

            {/* Card grid — 1 col mobile, 2 tablet, 3 desktop, 4 wide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => (
                          <SkeletonOfferCard key={i} />
                      ))
                    : displayed.length > 0
                    ? displayed.map((offer) => (
                          <OfferCard key={offer.code} pkg={offer} />
                      ))
                    : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <p className="text-sm font-medium">
                                {search ? `No offers found for "${search}"` : 'No offers available'}
                            </p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="mt-2 text-sm text-blue-500 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
            </div>

            {/* Pagination */}
            {!search && totalItems > itemsPerPage && totalPages > 1 && (
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
