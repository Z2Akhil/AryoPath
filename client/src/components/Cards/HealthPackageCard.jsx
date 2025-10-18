import React from "react";


const HealthPackageCard = ({ pkg }) => {
  const {
    name,
    rate,
    testCount,
    bookedCount,
    category,
    specimenType,
    fasting,
  
  } = pkg;

  return (
    <div className="w-full sm:max-w-sm bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Category Badge */}
      {category && (
        <div className="px-4 pt-4">
          <span className="inline-block bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded">
            {category}
          </span>
        </div>
      )}        {/* Content Section */}
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
              Specimen:{" "}
              <span className="font-medium">{specimenType || "N/A"}</span>
            </p>
            <p>
              Fasting: <span className="font-medium">{fasting || "N/A"}</span>
            </p>
          </div>

          {/* Price & Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <p className="text-gray-400 line-through text-xs sm:text-sm">
                ₹
                {rate?.b2C && rate.b2C !== rate.offerRate ? rate.b2C : ""}
              </p>
              <p className="text-blue-700 font-semibold text-sm sm:text-lg">
                ₹{rate?.offerRate || rate?.payAmt}
              </p>
            </div>
            <button className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition text-sm sm:text-base w-full sm:w-auto">
              Book Now
            </button>
          </div>

          {/* Highlights */}
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

export default HealthPackageCard;
