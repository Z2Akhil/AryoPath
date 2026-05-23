'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProfileCard from '@/components/cards/ProfileCard';
import TestCard from '@/components/cards/TestCard';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

type SortKey    = 'default' | 'price_asc' | 'price_desc' | 'name_asc';
type TypeFilter = 'all' | 'packages' | 'tests';

interface Concern {
    id: string;
    label: string;
    icon: string;
    description: string;
}

interface Props {
    concern: Concern;
    initialProfiles: Product[];
    initialTests: Product[];
}

const PAGE_SIZE = 24;

function applySortAndSearch(items: Product[], search: string, sort: SortKey): Product[] {
    let out = search
        ? items.filter((p) => p.name.toLowerCase().includes(search))
        : [...items];
    if (sort === 'name_asc')   out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price_asc')  out.sort((a, b) => getProductDisplayPrice(a).displayPrice - getProductDisplayPrice(b).displayPrice);
    if (sort === 'price_desc') out.sort((a, b) => getProductDisplayPrice(b).displayPrice - getProductDisplayPrice(a).displayPrice);
    return out;
}

export default function HealthConcernPageClient({ concern, initialProfiles, initialTests }: Props) {
    const [search, setSearch]               = useState('');
    const [sort, setSort]                   = useState<SortKey>('default');
    const [typeFilter, setTypeFilter]       = useState<TypeFilter>('all');
    const [shownPackages, setShownPackages] = useState(PAGE_SIZE);
    const [shownTests, setShownTests]       = useState(PAGE_SIZE);

    const lowerSearch = search.toLowerCase().trim();

    const filteredProfiles = useMemo(
        () => applySortAndSearch(initialProfiles, lowerSearch, sort),
        [initialProfiles, lowerSearch, sort]
    );
    const filteredTests = useMemo(
        () => applySortAndSearch(initialTests, lowerSearch, sort),
        [initialTests, lowerSearch, sort]
    );

    const showPackages = typeFilter !== 'tests';
    const showTests    = typeFilter !== 'packages';

    const totalVisible =
        (showPackages ? filteredProfiles.length : 0) +
        (showTests    ? filteredTests.length    : 0);

    const handleSearch = (val: string) => {
        setSearch(val);
        setShownPackages(PAGE_SIZE);
        setShownTests(PAGE_SIZE);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl leading-none">{concern.icon}</span>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                            {concern.label} Tests &amp; Packages
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{concern.description}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {initialProfiles.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {initialProfiles.length} health package{initialProfiles.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    {initialTests.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {initialTests.length} individual test{initialTests.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Breadcrumb ─────────────────────────────────────── */}
            <nav className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
                <Link href="/" className="hover:text-blue-500">Home</Link>
                <span>›</span>
                <span className="text-gray-700">{concern.label}</span>
            </nav>

            {/* ── Controls ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={`Search ${concern.label.toLowerCase()} tests…`}
                        className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    {search && (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value as SortKey); setShownPackages(PAGE_SIZE); setShownTests(PAGE_SIZE); }}
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-48"
                >
                    <option value="default">Default order</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name A–Z</option>
                </select>
            </div>

            {/* ── Type filter pills (only if both types exist) ──── */}
            {initialProfiles.length > 0 && initialTests.length > 0 && (
                <div className="flex gap-2 mb-5">
                    {(['all', 'packages', 'tests'] as TypeFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setTypeFilter(f)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                typeFilter === f
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {f === 'all' ? 'All' : f === 'packages' ? 'Health Packages' : 'Individual Tests'}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Search result label ───────────────────────────── */}
            {search && (
                <p className="text-sm text-gray-500 mb-4">
                    {totalVisible === 0
                        ? `No results for "${search}"`
                        : `${totalVisible} result${totalVisible !== 1 ? 's' : ''} for "${search}"`}
                </p>
            )}

            {/* ── Empty state ───────────────────────────────────── */}
            {totalVisible === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-5xl mb-3">{concern.icon}</span>
                    <p className="text-sm font-medium">
                        {search
                            ? `No ${concern.label.toLowerCase()} tests found for "${search}"`
                            : `No tests available for ${concern.label}`}
                    </p>
                    {search && (
                        <button onClick={() => handleSearch('')} className="mt-2 text-sm text-blue-500 hover:underline">
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {/* ── Health Packages ───────────────────────────────── */}
            {showPackages && filteredProfiles.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-base font-bold text-gray-800 mb-3">
                        Health Packages
                        <span className="ml-2 text-xs font-normal text-gray-400">({filteredProfiles.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                        {filteredProfiles.slice(0, shownPackages).map((pkg) => (
                            <ProfileCard key={pkg.code} pkg={pkg} />
                        ))}
                    </div>
                    {filteredProfiles.length > shownPackages && (
                        <div className="mt-5 text-center">
                            <button
                                onClick={() => setShownPackages((n) => n + PAGE_SIZE)}
                                className="px-6 py-2 text-sm font-semibold rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                Show more packages ({filteredProfiles.length - shownPackages} remaining)
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* ── Individual Tests ─────────────────────────────── */}
            {showTests && filteredTests.length > 0 && (
                <section>
                    <h2 className="text-base font-bold text-gray-800 mb-3">
                        Individual Tests
                        <span className="ml-2 text-xs font-normal text-gray-400">({filteredTests.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredTests.slice(0, shownTests).map((test) => (
                            <TestCard key={test.code} test={test} />
                        ))}
                    </div>
                    {filteredTests.length > shownTests && (
                        <div className="mt-5 text-center">
                            <button
                                onClick={() => setShownTests((n) => n + PAGE_SIZE)}
                                className="px-6 py-2 text-sm font-semibold rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                Show more tests ({filteredTests.length - shownTests} remaining)
                            </button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
