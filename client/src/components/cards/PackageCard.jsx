import React from "react";

const PackageCard = ({ pkg }) => {
  // ✅ Destructure props safely with defaults
  const {
    name = "Health Package",
    rate = {},
    testCount = 0,
    bookedCount = 0,
    category,
    specimenType,
    fasting,
    imageLocation,
    imageMaster = [],
  } = pkg;

 const imgSrc = imageLocation || imageMaster?.[0]?.imgLocations || "/packagePic.png";
 
  return (
    <div className="w-full sm:max-w-sm bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition">
      {/* Image Section */}
      <div className="relative">
        <img
          src={imgSrc}
          alt={name}
          onError={(e) => {
            e.currentTarget.onerror = null; // prevent infinite loop
            e.currentTarget.src = "/packagePic.png"; // fallback image
          }}
          className="w-full h-48 sm:h-52 md:h-56 object-cover"
        />
        {category && (
          <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded">
            {category}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-3 py-2 text-sm sm:text-base font-semibold">
          {name}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-1 truncate">
          {name}
        </h2>

        {/* Short info */}
        <div className="flex items-center justify-between bg-gray-100 rounded-full py-1 sm:py-2 px-3 sm:px-4 mb-3 text-xs sm:text-sm">
          <span className="font-medium text-gray-700">{testCount} Tests</span>
          <span className="text-gray-500">
            Booked: <strong>{bookedCount}</strong>
          </span>
        </div>

        {/* Sample & Fasting Info */}
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3">
          <p>
            Specimen: <span className="font-medium">{specimenType || "N/A"}</span>
          </p>
          <p>
            Fasting: <span className="font-medium">{fasting || "N/A"}</span>
          </p>
        </div>

        {/* Price & Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div>
            {rate?.b2C && rate.b2C !== rate.offerRate && (
              <p className="text-red-400 line-through font-bold text-xs sm:text-sm">
                ₹{rate.b2C}
              </p>
            )}
            <p className="text-blue-700 font-semibold text-sm sm:text-lg">
              ₹{rate?.offerRate || rate?.payAmt}
            </p>
          </div>
          <button className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition text-sm sm:text-base w-full sm:w-auto">
            Book Now
          </button>
        </div>

        {/* Footer */}
        <div className="border-t pt-3 mt-3 text-xs sm:text-sm text-gray-600">
          <ul className="space-y-1 text-[11px] sm:text-xs">
            <li>🏅 NABL, CAP, ISO 9001 Certified</li>
            <li>🏠 Free Home Sample Pickup</li>
            <li>💻 Online Report Delivery</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
