import { useCart } from "../../context/CartContext";

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

  const discount =
    rate.b2C && parseFloat(rate.b2C) > parseFloat(rate.offerRate)
      ? Math.round(
          ((parseFloat(rate.b2C) - parseFloat(rate.offerRate)) /
            parseFloat(rate.b2C)) *
            100
        )
      : 0;

  const { cart, addToCart, removeFromCart } = useCart();

  const inCart = cart.some((item) => item.code === code);

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

      {/* Price & Discount */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900">₹{rate.offerRate}</p>
            {rate.b2C && rate.b2C !== rate.offerRate && (
              <p className="text-gray-400 line-through text-sm">₹{rate.b2C}</p>
            )}
          </div>
          {discount > 0 && (
            <span
              className="mt-1 inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Add to Cart / Remove Button */}
        <button
          onClick={() => (inCart ? removeFromCart(code) : addToCart(test))}
          className={`font-medium px-5 py-2 rounded text-sm transition ${
            inCart
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {inCart ? "Remove" : "Add to Cart"}
        </button>
      </div>

      {/* Footer: Booked Count */}
      <p className="text-xs text-gray-500">
        Booked by {bookedCount} patients
      </p>
    </div>
  );
};

export default TestCard;
