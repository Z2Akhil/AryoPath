import { Link } from "react-router-dom";
import { getProductDisplayPrice } from "../../api/backendProductApi";

const PackageCard = ({ pkg }) => {
  const {
    name = "Health Package",
    testCount = 0,
    bookedCount = 0,
    category,
    specimenType,
    fasting,
    imageLocation,
    imageMaster = [],
    isCustomized
  } = pkg;

  const imgSrc = imageLocation || imageMaster?.[0]?.imgLocations || "/packagePic.png";
  
  // Get enhanced pricing information
  const priceInfo = getProductDisplayPrice(pkg);

  return (
    <div className="w-full sm:max-w-sm bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section - Fixed Height */}
      <div className="relative h-48 sm:h-52 shrink-0">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/packagePic.png";
          }}
          className="w-full h-full object-cover"
        />
        {category && (
          <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded shadow-md">
            {category}
          </span>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent text-white px-3 py-2 text-sm sm:text-base font-semibold">
          {name}
        </div>
      </div>

      {/* Content Section - Flexible */}
      <div className="p-3 sm:p-4 flex flex-col grow">
        {/* Title - Fixed Height */}
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 line-clamp-1">
          {name}
        </h2>

        {/* Short info - Fixed Height */}
        <div className="flex items-center justify-between bg-gray-100 rounded-full py-2 px-3 sm:px-4 mb-3 text-xs sm:text-sm">
          <span className="font-medium text-gray-700">{testCount} Tests</span>
          <span className="text-gray-500">
            Booked: <strong>{bookedCount}</strong>
          </span>
        </div>

        {/* Sample & Fasting Info - Fixed Height */}
        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3">
          <p>
            Specimen: <span className="font-medium">{specimenType || "N/A"}</span>
          </p>
          <p>
            Fasting: <span className="font-medium">{fasting || "N/A"}</span>
          </p>
        </div>

        {/* Price Section - First Row */}
        <div className="min-h-[50px] flex items-center mb-3">
          {priceInfo.hasDiscount ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-gray-500 line-through font-medium text-sm sm:text-base">
                ₹{priceInfo.originalPrice}
              </p>
              <p className="text-blue-700 font-bold text-xl sm:text-2xl">
                ₹{priceInfo.displayPrice}
              </p>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {priceInfo.discountPercentage}% OFF
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-gray-900 font-bold text-xl sm:text-2xl">
                ₹{priceInfo.displayPrice} 
              </p>
            </div>
          )}
        </div>

        {/* Buttons Section - Second Row */}
        <div className="flex gap-2 mb-3">
          <Link
            to={`/packages/${pkg.code}`}
            className="bg-gray-200 border-blue-700 text-black-700 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium flex-1 text-center"
          >
            View More
          </Link>
          <Link
            to={`/packages/${pkg.code}`}
            className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium flex-1 text-center"
          >
            Book Now
          </Link>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t pt-3 mt-auto">
          <ul className="space-y-1 text-xs text-gray-600">
            <li className="flex items-center gap-1">
              <span>🏅</span>
              <span>NABL, CAP, ISO 9001 Certified</span>
            </li>
            <li className="flex items-center gap-1">
              <span>🏠</span>
              <span>Free Home Sample Pickup</span>
            </li>
            <li className="flex items-center gap-1">
              <span>💻</span>
              <span>Online Report Delivery</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;