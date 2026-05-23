"use client";

import Link from "next/link";
import { getProductDisplayPrice, getImageUrl } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import { useState } from "react";
import AddToCartWithValidation from "./AddToCartWithValidation";
import ImagePreviewModal from "../common/ImagePreviewModal";

interface ProfileCardProps {
  pkg: any;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ pkg }) => {
  const {
    name = "Health Package",
    testCount = 0,
    bookedCount = 0,
    category,
    fasting,
  } = pkg;

  const imgSrc = getImageUrl(pkg);
  const priceInfo = getProductDisplayPrice(pkg);
  const [showPreview, setShowPreview] = useState(false);
  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "PROFILE"}/${pkg.code}`;

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
          {/* Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {category && (
              <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {category}
              </span>
            )}
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

          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
            <span className="font-semibold">{testCount} Tests</span>
            <span className="text-gray-400">•</span>
            {fasting
              ? <span className={fasting === "CF" ? "text-orange-600 font-semibold" : "text-gray-500"}>{fasting === "CF" ? "Fasting" : "No Fast"}</span>
              : <span>Booked: <strong>{bookedCount}</strong></span>
            }
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-blue-700 leading-none">₹{priceInfo.originalPrice}</span>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            {/* Mobile: icon-only cart button */}
            <div className="sm:hidden">
              <AddToCartWithValidation
                productCode={pkg.code}
                productType={pkg.type || "PROFILE"}
                productName={name}
                iconOnly
              />
            </div>
            {/* sm+: full text button */}
            <div className="hidden sm:block flex-1">
              <AddToCartWithValidation
                productCode={pkg.code}
                productType={pkg.type || "PROFILE"}
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
      </div>

      {showPreview && (
        <ImagePreviewModal imgSrc={imgSrc} name={name} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
};

export default ProfileCard;
