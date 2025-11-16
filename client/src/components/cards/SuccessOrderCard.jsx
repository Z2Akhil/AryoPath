import React from "react";
import { X, CheckCircle2 } from "lucide-react";

const SuccessOrderCard = ({ orderId, packageName, amount, onClose }) => {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden animate-fadeIn">
        <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-xl p-6 relative animate-popIn border border-gray-200">

        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="text-green-600 w-7 h-7" />
          <h2 className="text-xl font-bold text-gray-900">Order Confirmed</h2>
        </div>

        <p className="text-gray-600 text-sm mb-4">
          Your order has been successfully placed.
        </p>

        {/* Details */}
        <div className="bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold text-gray-800">Order ID:</span> #{orderId}
          </p>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-semibold text-gray-800">Package/Test:</span> {packageName}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-800">Amount Paid:</span> ₹{amount}
          </p>
        </div>

        {/* Next Steps */}
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Next Steps</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mb-5">
          <li>Our team will contact you shortly for sample collection.</li>
          <li>You can track your order anytime in <span className="font-medium text-gray-800">My Orders</span>.</li>
        </ul>

        {/* Footer */}
        <p className="text-sm text-gray-700 text-center font-medium">
          Thank you for choosing us!
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-popIn {
          animation: popIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
    
  );
};

export default SuccessOrderCard;
