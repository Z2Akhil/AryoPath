'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { slugify } from '@/lib/slugify';
import AddToCartWithValidation from '@/components/cards/AddToCartWithValidation';
import type { ConcernGroup } from './HealthConcernSection';

interface Props {
    concerns: ConcernGroup[];
}

const CONCERN_COLORS: Record<string, { activeBg: string; badge: string }> = {
    thyroid:    { activeBg: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700' },
    diabetes:   { activeBg: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    heart:      { activeBg: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
    liver:      { activeBg: 'bg-amber-600',  badge: 'bg-amber-100 text-amber-700' },
    kidney:     { activeBg: 'bg-teal-600',   badge: 'bg-teal-100 text-teal-700' },
    blood:      { activeBg: 'bg-rose-600',   badge: 'bg-rose-100 text-rose-700' },
    infections: { activeBg: 'bg-sky-600',    badge: 'bg-sky-100 text-sky-700' },
    wellness:   { activeBg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
};

function getColors(id: string) {
    return CONCERN_COLORS[id] ?? { activeBg: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700' };
}

const SCROLL_BY = 740; // ~4 cards + gap

export default function HealthConcernTabs({ concerns }: Props) {
    const [activeId, setActiveId] = useState(concerns[0]?.id ?? '');
    const [canScrollLeft, setCanScrollLeft]   = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const updateArrows = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    // Recheck whenever active concern changes (new set of cards)
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = 0;
        // Wait one frame for the DOM to settle
        requestAnimationFrame(updateArrows);
    }, [activeId, updateArrows]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -SCROLL_BY : SCROLL_BY, behavior: 'smooth' });
    };

    const active = concerns.find((c) => c.id === activeId) ?? concerns[0];
    const col    = getColors(activeId);

    return (
        <section className="px-4 mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Tests by Health Concern</h2>
                <Link
                    href={`/health-concern/${activeId}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    View all →
                </Link>
            </div>

            {/* ── Concern tab pills ──────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
                {concerns.map((c) => {
                    const isActive = c.id === activeId;
                    const cc       = getColors(c.id);
                    return (
                        <button
                            key={c.id}
                            onClick={() => setActiveId(c.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                                isActive
                                    ? `${cc.activeBg} text-white border-transparent shadow-sm`
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                            }`}
                        >
                            <span className="text-base leading-none">{c.icon}</span>
                            <span>{c.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Product cards with arrow nav ──────────────────── */}
            {active && (
                <div className="relative group/scroller">
                    {/* Left arrow */}
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 ${
                            canScrollLeft
                                ? 'opacity-100 pointer-events-auto'
                                : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Scroll container */}
                    <div
                        ref={scrollRef}
                        onScroll={updateArrows}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
                    >
                        {active.products.map((product) => {
                            const price     = getProductDisplayPrice(product);
                            const isProfile = product.type === 'PROFILE' || product.type === 'POP';
                            const typeLabel = isProfile ? 'Package' : 'Lab Test';
                            const href      = `/profiles/${slugify(product.name)}/${product.type}/${product.code}`;

                            return (
                                <div
                                    key={product.code}
                                    className="shrink-0 w-44 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                                >
                                    <div className="p-3 flex flex-col flex-1 gap-2">
                                        {/* Type badge */}
                                        <span className={`self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${col.badge}`}>
                                            {typeLabel}
                                        </span>

                                        {/* Name */}
                                        <Link href={href} className="flex-1">
                                            <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-3 hover:text-blue-600 transition-colors">
                                                {product.name}
                                            </p>
                                        </Link>

                                        {/* Test count for packages */}
                                        {isProfile && (product.testCount ?? 0) > 0 && (
                                            <p className="text-[10px] text-gray-400">{product.testCount} tests included</p>
                                        )}

                                        {/* Fasting badge */}
                                        {!isProfile && product.fasting && product.fasting !== 'N' && product.fasting !== 'N/A' && (
                                            <span className="self-start text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                                Fasting
                                            </span>
                                        )}

                                        {/* Price + Cart */}
                                        <div className="mt-auto pt-1">
                                            <div className="flex items-baseline gap-1.5 mb-2">
                                                <span className="text-sm font-extrabold text-gray-900">
                                                    ₹{price.displayPrice || price.originalPrice}
                                                </span>
                                                {price.hasDiscount && (
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                        {price.discountPercentage}% OFF
                                                    </span>
                                                )}
                                            </div>

                                            <AddToCartWithValidation
                                                productCode={product.code}
                                                productType={product.type}
                                                productName={product.name}
                                                buttonText="Add to Cart"
                                                showIcon={false}
                                                className="text-[11px] font-semibold py-1.5 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* View all → card */}
                        <Link
                            href={`/health-concern/${activeId}`}
                            className="shrink-0 w-36 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors p-4 text-center"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                            <span className="text-xs font-semibold leading-tight">
                                View all {active.label} tests
                            </span>
                        </Link>
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 ${
                            canScrollRight
                                ? 'opacity-100 pointer-events-auto'
                                : 'opacity-0 pointer-events-none'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    );
}
