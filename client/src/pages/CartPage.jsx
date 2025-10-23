import { useCart } from "../context/CartContext";
import { Trash2, ShoppingCart } from "lucide-react";

const CartPage = () => {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.rate.offerRate || 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="text-blue-600 w-7 h-7" />
        <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500 text-lg mb-4">🛍️ Your cart is empty</p>
          <p className="text-gray-400 text-sm">Add some tests to get started!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map((item) => (
              <div
                key={item.code}
                className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex-1 pr-3">
                  <h3 className="font-medium text-gray-900 text-base">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Code: {item.code || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold text-blue-700">
                      ₹{item.rate.offerRate}
                    </span>{" "}
                    {item.rate.b2C && item.rate.b2C !== item.rate.offerRate && (
                      <span className="text-gray-400 line-through text-xs ml-1">
                        ₹{item.rate.b2C}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.code)}
                  className="text-red-600 hover:text-red-700 transition p-1.5 rounded-md hover:bg-red-50"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Right: Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Order Summary
            </h2>

            <div className="space-y-1 border-b pb-3">
              {cart.map((item) => (
                <div
                  key={item.code}
                  className="flex justify-between text-sm text-gray-700"
                >
                  <span className="truncate w-44">{item.name}</span>
                  <span>₹{item.rate.offerRate}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-base font-medium text-gray-800">Total</p>
              <p className="text-base font-semibold text-blue-700">
                ₹{total.toFixed(2)}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={clearCart}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition text-sm"
              >
                Clear Cart
              </button>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
