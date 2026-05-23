"use client";

import React from "react";
import Link from "next/link";
import { getProductDisplayPrice } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import AddToCartWithValidation from "./AddToCartWithValidation";

interface OfferCardProps {
  pkg: any;
}

const OfferCard: React.FC<OfferCardProps> = ({ pkg }) => {
  const { name, childs = [], testCount = 0 } = pkg;
  const priceInfo = getProductDisplayPrice(pkg);
  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "OFFER"}/${pkg.code}`;

  const preview = childs
    .slice(0, 3)
    .map((c: any) => c.name)
    .join(" · ");
  const remaining = testCount - 3;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full overflow-hidden">
      {/* Accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">
        {/* Row 1: discount badge + chevron link */}
        <div className="flex items-center justify-between gap-2">
          {priceInfo.hasDiscount ? (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
              🏷️ {priceInfo.discountPercentage}% OFF
            </span>
          ) : (
            <span className="inline-flex items-center bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-lg">
              Special Offer
            </span>
          )}
          <Link
            href={detailPath}
            aria-label="View offer details"
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors"
          >
            Details
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Row 2: offer name */}
        <Link href={detailPath} className="block">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 uppercase tracking-wide leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Row 3: test count + preview */}
        <div className="bg-gray-50 rounded-xl px-2.5 py-2 space-y-0.5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-bold text-blue-700">{testCount} Tests included</span>
          </div>
          {preview && (
            <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
              {preview}
              {remaining > 0 && (
                <span className="text-blue-500 font-semibold"> +{remaining} more</span>
              )}
            </p>
          )}
        </div>

        {/* Row 4: price + actions */}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-gray-900 leading-none">
              ₹{priceInfo.originalPrice}
            </span>
            {priceInfo.hasDiscount && (
              <span className="text-xs text-gray-400 font-medium">Thyrocare rate</span>
            )}
          </div>

          <div className="flex gap-2">
            <AddToCartWithValidation
              productCode={pkg.code}
              productType={pkg.type || "OFFER"}
              productName={name}
              showIcon={false}
              className="flex-1 !text-sm"
            />
            <Link
              href={detailPath}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all whitespace-nowrap"
            >
              View
            </Link>
          </div>
        </div>

        {/* Trust row */}
        <div className="flex items-center gap-3 pt-1.5 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">✓ Free Home Collection</span>
          <span className="text-[10px] text-gray-400">✓ NABL Certified</span>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
