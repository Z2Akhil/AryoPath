import { AlertCircle, Home, Percent, Calendar, CreditCard, CheckCircle } from "lucide-react";
import Form from "../components/Form.jsx";

const PackageDetailedPage = ({ pkg }) => {
  if (!pkg) {
    return (
      <div className="text-center py-20 text-gray-500">
        No package data available.
      </div>
    );
  }

  // Group tests by category
  const groupedTests = pkg.childs?.reduce((acc, test) => {
    if (!acc[test.groupName]) acc[test.groupName] = [];
    acc[test.groupName].push(test.name);
    return acc;
  }, {}) || {};

  // Check for discount
  const isDiscounted =
    pkg.rate &&
    parseFloat(pkg.rate.offerRate) < parseFloat(pkg.rate.b2C);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Package Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{pkg.name}</h1>

          {/* Price Section */}
          {pkg.rate && (
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-2xl font-bold text-blue-600">₹{pkg.rate.offerRate}</p>
              {isDiscounted && (
                <>
                  <p className="text-gray-400 line-through">₹{pkg.rate.b2C}</p>
                  <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-md">
                    {Math.round(((pkg.rate.b2C - pkg.rate.offerRate) / pkg.rate.b2C) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          )}

          {/* Fasting / Precaution Info */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="text-blue-500 w-6 h-6 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Precaution</h3>
              <p className="text-gray-600 mt-1">
                {pkg.fasting === "CF"
                  ? "Do not consume anything other than water for 8 - 10 hours before the test."
                  : "No fasting required for this test."}
              </p>
            </div>
          </div>

          {/* Included Tests */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Included Tests ({pkg.childs?.length || 0})
          </h2>
          <div className="space-y-6">
            {Object.keys(groupedTests).map((category) => (
              <div key={category}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{category}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {groupedTests[category].map((test, idx) => (
                    <li key={idx}>{test}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Booking Form */}
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 h-fit">
          <Form pkgName={pkg.name} pkgRate={pkg.rate?.offerRate} />
        </div>
      </div>

      {/* Why Book With Us Section */}
      <div className="max-w-6xl mx-auto mt-16 px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-10">Why book with us?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
            <div className="flex flex-col items-center text-center text-gray-600">
              <svg
                className="w-10 h-10 mb-3 text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 22s8-4 8-10V6a8 8 0 10-16 0v6c0 6 8 10 8 10z" />
              </svg>
              <p className="font-medium">100% Safe & Hygienic</p>
            </div>
            <div className="flex flex-col items-center text-center text-gray-600">
              <Home className="w-10 h-10 mb-3 text-blue-400" />
              <p className="font-medium">Free Home Sample Pick Up</p>
            </div>
            <div className="flex flex-col items-center text-center text-gray-600">
              <Percent className="w-10 h-10 mb-3 text-blue-400" />
              <p className="font-medium">Heavy Discounts</p>
            </div>
            <div className="flex flex-col items-center text-center text-gray-600">
              <Calendar className="w-10 h-10 mb-3 text-blue-400" />
              <p className="font-medium">View Reports Online</p>
            </div>
            <div className="flex flex-col items-center text-center text-gray-600">
              <CreditCard className="w-10 h-10 mb-3 text-blue-400" />
              <p className="font-medium">Easy Payment Options</p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-gray-700">
              <CheckCircle className="w-10 h-10 mb-3 text-green-500" />
              <h4 className="font-semibold mb-1">1. Book Test</h4>
              <p className="text-gray-500 text-sm">
                Choose your test and preferred slot online easily.
              </p>
            </div>
            <div className="flex flex-col items-center text-gray-700">
              <Home className="w-10 h-10 mb-3 text-green-500" />
              <h4 className="font-semibold mb-1">2. Sample Collection</h4>
              <p className="text-gray-500 text-sm">
                Our expert phlebotomist collects your sample from home.
              </p>
            </div>
            <div className="flex flex-col items-center text-gray-700">
              <Calendar className="w-10 h-10 mb-3 text-green-500" />
              <h4 className="font-semibold mb-1">3. Get Reports</h4>
              <p className="text-gray-500 text-sm">
                Access your reports online within 24–48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailedPage;
