"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getProductDisplayPrice, getImageUrl } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import AddToCartWithValidation from "./AddToCartWithValidation";
import ImagePreviewModal from "../common/ImagePreviewModal";

interface OfferCardProps {
  pkg: any;
}

const OfferCard: React.FC<OfferCardProps> = ({ pkg }) => {
  const { name, childs = [], testCount = 0 } = pkg;
  const priceInfo = getProductDisplayPrice(pkg);
  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "OFFER"}/${pkg.code}`;
  const imgSrc = getImageUrl(pkg);
  const [showPreview, setShowPreview] = useState(false);

  const preview = childs
    .slice(0, 3)
    .map((c: any) => c.name)
    .join(" · ");
  const remaining = testCount - 3;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full overflow-hidden group">

        {/* Image */}
        <div className="relative h-40 sm:h-44 shrink-0 overflow-hidden">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onClick={() => setShowPreview(true)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/packagePic.webp";
            }}
            className="w-full h-full object-cover object-top cursor-pointer group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient scrim — purple/indigo tint for offers */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/70 via-indigo-900/10 to-transparent pointer-events-none" />

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Special Offer
            </span>
            {priceInfo.hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {priceInfo.discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* View chevron */}
          <Link
            href={detailPath}
            aria-label="View details"
            className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/60 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Name on image */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
            <Link href={detailPath} className="block text-white font-bold text-sm leading-snug line-clamp-2 hover:underline">
              {name}
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 flex flex-col flex-1 gap-2">

          {/* Test count + preview */}
          <div className="bg-indigo-50 rounded-xl px-2.5 py-2 space-y-0.5">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-bold text-indigo-700">{testCount} Tests included</span>
            </div>
            {preview && (
              <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                {preview}
                {remaining > 0 && (
                  <span className="text-indigo-500 font-semibold"> +{remaining} more</span>
                )}
              </p>
            )}
          </div>

          {/* Price + actions */}
          <div className="mt-auto space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-blue-700 leading-none">₹{priceInfo.originalPrice}</span>
            </div>

            <div className="flex gap-2">
              {/* Mobile: icon-only */}
              <div className="sm:hidden">
                <AddToCartWithValidation
                  productCode={pkg.code}
                  productType={pkg.type || "OFFER"}
                  productName={name}
                  iconOnly
                />
              </div>
              {/* sm+: full text */}
              <div className="hidden sm:block flex-1">
                <AddToCartWithValidation
                  productCode={pkg.code}
                  productType={pkg.type || "OFFER"}
                  productName={name}
                  showIcon={false}
                  className="!text-sm"
                />
              </div>
              <Link
                href={detailPath}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 active:scale-95 transition-all"
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

      {showPreview && (
        <ImagePreviewModal imgSrc={imgSrc} name={name} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
};

export default OfferCard;
