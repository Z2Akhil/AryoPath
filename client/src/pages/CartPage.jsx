import { useCart } from "../context/CartContext";
import { Trash2, ShoppingCart } from "lucide-react";
import Form from "../components/Form";

const CartPage = () => {
  const { cart, removeFromCart } = useCart();

  const total = cart?.items?.reduce(
    (sum, item) => sum + parseFloat(item?.sellingPrice || 0),
    0
  ) || 0;

  const pkgNames = cart?.items?.map((item) => item?.name) || [];
  const pkgIds = cart?.items?.map((item) => item?.productCode) || [];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="text-blue-600 w-7 h-7" />
        <h1 className="text-2xl font-bold text-gray-800">Items in your cart</h1>
      </div>

      {cart?.totalItems === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500 text-lg mb-4">🛒 Your cart is empty</p>
          <p className="text-gray-400 text-sm">Add some tests to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🧾 Cart Section */}
          <div className="lg:col-span-2 bg-white rounded-xl">
            {/* Table */}
            <div className="rounded-xl overflow-hidden border">
              {/* Desktop Header */}
              <div className="hidden sm:grid grid-cols-7 bg-blue-50 text-gray-800 font-semibold border-b border-blue-200 text-sm">
                <div className="col-span-3 py-3 px-4 border-r border-blue-200">Item</div>
                <div className="col-span-2 py-3 px-4 border-r border-blue-200">Price</div>
                <div className="col-span-2 py-3 px-4 text-center">Action</div>
              </div>

              {/* Body */}
              <div className="divide-y divide-gray-100">
                {cart?.items?.map((item) => (
                  <div
                    key={item.productCode}
                    className="grid grid-cols-1 sm:grid-cols-7 gap-3 sm:gap-0 p-4 sm:p-0 hover:bg-gray-50 transition text-sm"
                  >
                    {/* Item Name - Full width on mobile, 3 cols on desktop */}
                    <div className="sm:col-span-3 py-2 sm:py-3 px-4 text-gray-800 font-medium">
                      <div className="text-base font-semibold mb-1">{item.name}</div>
                      <div className="text-xs text-gray-500">Code: {item.productCode}</div>
                    </div>

                    {/* Price - Full width on mobile, 2 cols on desktop */}
                    <div className="sm:col-span-2 py-2 sm:py-3 px-4">
                      <div className="flex flex-col">
                        {item.discount > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 line-through text-sm">
                                ₹{item.originalPrice.toFixed(2)}
                              </span>
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                                Save ₹{item.discount.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-blue-700 font-bold text-lg">
                              ₹{item.sellingPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-blue-700 font-bold text-lg">
                            ₹{item.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action - Full width on mobile, 2 cols on desktop */}
                    <div className="sm:col-span-2 py-2 sm:py-3 px-4 text-center">
                      <button
                        onClick={() => removeFromCart(item.productCode)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="flex flex-col sm:flex-row justify-end items-center gap-2 sm:gap-0 py-4 px-6 bg-gray-50 border-t border-gray-200">
                <p className="text-lg sm:text-base font-semibold text-gray-800 mx-1">
                  Total Payable Amount: 
                </p>
                <p className="text-lg sm:text-xl font-bold text-blue-700">
                  ₹{total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Add More Button */}
            <div className="p-4 bg-white">
              <a
                href="/tests"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-5 py-2.5 rounded-md shadow-sm transition"
              >
                + Add More Tests
              </a>
            </div>
          </div>

          {/* 🧩 Form Section */}
            <Form pkgName={pkgNames} pkgRate={total} pkgId={pkgIds} />
        </div>
      )}
    </div>
  );
};

export default CartPage;
