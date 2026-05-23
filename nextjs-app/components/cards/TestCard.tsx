"use client";

import React from "react";
import Link from "next/link";
import { getProductDisplayPrice } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import AddToCartWithValidation from "./AddToCartWithValidation";

interface TestCardProps {
  test: any;
}

const CATEGORY_STYLES: Record<string, { border: string; chip: string }> = {
  THYROID:  { border: "border-l-purple-400", chip: "bg-purple-50 text-purple-700" },
  DIABETES: { border: "border-l-orange-400", chip: "bg-orange-50 text-orange-700" },
  LIVER:    { border: "border-l-amber-400",  chip: "bg-amber-50 text-amber-700"  },
  KIDNEY:   { border: "border-l-cyan-400",   chip: "bg-cyan-50 text-cyan-700"    },
  CBC:      { border: "border-l-red-400",    chip: "bg-red-50 text-red-700"      },
  LIPID:    { border: "border-l-emerald-400",chip: "bg-emerald-50 text-emerald-700" },
  VITAMIN:  { border: "border-l-yellow-400", chip: "bg-yellow-50 text-yellow-700" },
  HORMONE:  { border: "border-l-pink-400",   chip: "bg-pink-50 text-pink-700"    },
};

function getCategoryStyle(category: string) {
  const key = Object.keys(CATEGORY_STYLES).find((k) =>
    (category || "").toUpperCase().includes(k)
  );
  return key
    ? CATEGORY_STYLES[key]
    : { border: "border-l-blue-400", chip: "bg-blue-50 text-blue-700" };
}

const TestCard: React.FC<TestCardProps> = ({ test }) => {
  const {
    name = "Unknown Test",
    code = "",
    category = "",
    fasting = "",
    bookedCount = "0",
  } = test;

  const priceInfo = getProductDisplayPrice(test);
  const { border, chip } = getCategoryStyle(category);
  const detailPath = `/profiles/${slugify(name)}/${test.type || "TEST"}/${code}`;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 border-l-4 ${border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full`}
    >
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Category chip */}
        <span
          className={`self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${chip}`}
        >
          {category || "General"}
        </span>

        {/* Name */}
        <Link href={detailPath} className="block flex-1">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-3 hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-end justify-between gap-1 mt-auto">
          <div>
            <p className="text-base sm:text-lg font-extrabold text-gray-900 leading-none">
              ₹{priceInfo.originalPrice}
            </p>
            {priceInfo.hasDiscount && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">
                {priceInfo.discountPercentage}% OFF
              </span>
            )}
          </div>
          {fasting && fasting !== "N/A" && (
            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
              Fasting
            </span>
          )}
        </div>

        {/* Add to cart */}
        <AddToCartWithValidation
          productCode={code}
          productType={test.type || "TEST"}
          productName={name}
          className="w-full !text-xs !py-2"
          buttonText="Add to Cart"
          showIcon={false}
        />

        {/* Booked count */}
        {bookedCount && parseInt(bookedCount) > 0 && (
          <p className="text-[10px] text-gray-400 text-center">
            ✓ {parseInt(bookedCount).toLocaleString()} patients booked
          </p>
        )}
      </div>
    </div>
  );
};

export default TestCard;
