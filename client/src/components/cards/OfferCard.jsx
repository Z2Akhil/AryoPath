import React from "react";
import { Link } from "react-router-dom";
import { getProductDisplayPrice } from "../../api/backendProductApi";

const OfferCard = ({ pkg }) => {
  const { name, childs = [], testCount = 0 } = pkg;

  // Get enhanced pricing information using the same logic as other cards
  const priceInfo = getProductDisplayPrice(pkg);

  // Display first 3 tests as preview
  const testPreview =
    childs.slice(0, 3).map((child) => child.name).join(", ") +
    (childs.length > 3 ? "..." : "");

  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between hover:shadow-xl transition">
      {/* Package Name */}
      <h2 className="font-bold text-lg text-gray-900 mb-2 uppercase">{name}</h2>

      {/* Test List */}
      <p className="text-gray-700 text-sm mb-6 lowercase">
        {testPreview}{" "}
        <span className="text-blue-500 font-medium">+{testCount} Tests</span>
      </p>

      {/* Price + Book Section */}
      <div className="flex items-center justify-between mt-auto">
        {/* Left side: Price & discount */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900">₹{priceInfo.displayPrice}</p>
            {priceInfo.hasDiscount && (
              <p className="text-gray-400 line-through text-sm">₹{priceInfo.originalPrice}</p>
            )}
          </div>
          {priceInfo.hasDiscount && (
            <span
              className="mt-1 inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              {priceInfo.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Right side: Book button */}
        <Link
          to={`/packages/${pkg.code}`}
          className="bg-green-600 text-white font-medium px-5 py-2 rounded hover:bg-green-700 transition text-sm"
        >
          Book
        </Link>
      </div>
    </div>
  );
};

export default OfferCard;
