import { useCart } from "../../context/CartContext";
import { getProductDisplayPrice } from "../../api/backendProductApi";
import { Link } from "react-router-dom";

const TestCard = ({ test }) => {
  const {
    name = "Unknown Test",
    code = "",
    rate = { b2B: "0", b2C: "0", offerRate: "0", payAmt: "0" },
    bookedCount = "0",
    category = "",
    specimenType = "N/A",
    units = "",
    fasting = "N/A",
  } = test;

  // Get enhanced pricing information using the same logic as PackageCard
  const priceInfo = getProductDisplayPrice(test);

  const { cart, addToCart, removeFromCart } = useCart();

  const inCart = cart?.items?.some((item) => item.productCode === code) || false;

  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between hover:shadow-xl transition">
      {/* Header: Test Name & Category */}
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900">{name}</h2>
        <p className="text-sm text-gray-500">
          {code} • {category}
        </p>
      </div>

      {/* Specimen / Units / Fasting Info */}
      <div className="text-sm text-gray-600 mb-4">
        <p>
          Specimen: <span className="font-medium">{specimenType}</span>
        </p>
        <p>
          Units: <span className="font-medium">{units}</span>
        </p>
        <p>
          Fasting: <span className="font-medium">{fasting}</span>
        </p>
      </div>

      {/* Price & Discount - Consistent layout for all cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3 flex-wrap">
            {priceInfo.hasDiscount ? (
              <>
                <p className="text-gray-500 line-through font-medium text-sm">
                  ₹{priceInfo.originalPrice}
                </p>
                <p className="text-blue-700 font-bold text-xl">
                  ₹{priceInfo.displayPrice}
                </p>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {priceInfo.discountPercentage}% OFF
                </span>
              </>
            ) : (
              <>
                <p className="text-blue-700 font-bold text-xl">
                  ₹{priceInfo.displayPrice}
                </p>
                {/* Empty space to maintain consistent layout */}
                <div className="invisible">
                  <p className="text-gray-500 line-through font-medium text-sm">
                    ₹0
                  </p>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    0% OFF
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add to Cart / View Cart Button */}
        {inCart ? (
          <Link
            to="/cart"
            className="bg-blue-600 text-white font-medium px-5 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            View Cart
          </Link>
        ) : (
          <button
            onClick={() => addToCart(test)}
            className="bg-green-600 text-white font-medium px-5 py-2 rounded text-sm hover:bg-green-700 transition"
          >
            Add to Cart
          </button>
        )}
      </div>

      {/* Footer: Booked Count */}
      <p className="text-xs text-gray-500">
        Booked by {bookedCount} patients
      </p>
    </div>
  );
};

export default TestCard;
