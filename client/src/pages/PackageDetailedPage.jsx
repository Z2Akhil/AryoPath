import { AlertCircle, Home, Percent, Share2, ChevronDown, Calendar, CreditCard, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Form from "../components/Form.jsx";
import { getProductsFromBackend, getProductDisplayPrice } from "../api/backendProductApi";
import SkeletonPackageDetailed from "../components/cards/SkeletonPackageDetailed";

const PackageDetailedPage = () => {
  const { code } = useParams();
  const [openCategory, setOpenCategory] = useState(new Set());
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getProductsFromBackend("ALL");
        setPackages(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Initialize categories when packages are loaded
  useEffect(() => {
    if (packages.length > 0 && code) {
      const pkg = packages.find((p) => p.code === code);
      if (pkg && pkg.childs) {
        const groupedTests = pkg.childs.reduce((acc, test) => {
          if (!acc[test.groupName]) acc[test.groupName] = [];
          acc[test.groupName].push(test.name);
          return acc;
        }, {});
        
        if (Object.keys(groupedTests).length > 0) {
          const allCategories = new Set(Object.keys(groupedTests));
          setOpenCategory(allCategories);
        }
      }
    }
  }, [packages, code]);

  const handleShare = async (pkg) => {
    const shareUrl = `${window.location.origin}/package/${pkg.code}`;
    const shareData = {
      title: pkg.name,
      text: `Check out this test package: ${pkg.name}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return <SkeletonPackageDetailed />;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const pkg = packages.find((p) => p.code === code);

  if (!pkg) {
    return (
      <div className="text-center py-20 text-gray-500">
        No package data available.
      </div>
    );
  }

  const groupedTests = pkg.childs?.reduce((acc, test) => {
    if (!acc[test.groupName]) acc[test.groupName] = [];
    acc[test.groupName].push(test.name);
    return acc;
  }, {}) || {};

  const toggleCategory = (category) => {
    const newOpenCategory = new Set(openCategory);
    if (newOpenCategory.has(category)) {
      newOpenCategory.delete(category);
    } else {
      newOpenCategory.add(category);
    }
    setOpenCategory(newOpenCategory);
  };

  // Get enhanced pricing information using the same logic as PackageCard
  const priceInfo = getProductDisplayPrice(pkg);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-blue-600 transition-colors">Home</a></li>
            <li className="flex items-center">
              <ChevronDown className="w-4 h-4 rotate-270" />
              <a href="/packages" className="ml-2 hover:text-blue-600 transition-colors">Packages</a>
            </li>
            <li className="flex items-center">
              <ChevronDown className="w-4 h-4 rotate-270" />
              <span className="ml-2 text-gray-900 font-medium truncate max-w-xs">{pkg.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Package Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{pkg.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {pkg.testCount || pkg.childs?.length || 0} Tests Included
                    </span>
                    {pkg.fasting && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        {pkg.fasting === "CF" ? "Fasting Required" : "No Fasting"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleShare(pkg)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all mt-4 sm:mt-0"
                  title="Share this test"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>
              </div>

              {/* Price Section */}
              {pkg.rate && (
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-baseline gap-3 mb-4 sm:mb-0">
                      <p className="text-4xl font-bold text-blue-700">₹{priceInfo.displayPrice}</p>
                      {priceInfo.hasDiscount && (
                        <div className="flex items-center gap-2">
                          <p className="text-xl text-gray-500 line-through">₹{priceInfo.originalPrice}</p>
                          <span className="bg-linear-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                            {priceInfo.discountPercentage}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                    {priceInfo.hasDiscount && (
                      <div className="text-sm text-gray-600">
                        You save ₹{priceInfo.originalPrice - priceInfo.displayPrice}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fasting / Precaution Info */}
              {pkg.fasting && (
                <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">Important Instructions</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {pkg.fasting === "CF"
                          ? "For accurate results, please do not consume anything other than water for 8-10 hours before the test. You may drink water as needed."
                          : "No special preparation required. You can take this test at any time of the day."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Included Tests */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Included Tests ({pkg.childs?.length || 0})
                  </h2>
                  <div className="text-sm text-gray-600">
                    All categories expanded
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.keys(groupedTests).map((category) => (
                    <div key={category} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center px-6 py-4 bg-linear-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900">{category}</span>
                          <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                            {groupedTests[category].length} tests
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${openCategory.has(category) ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {openCategory.has(category) && (
                        <div className="border-t border-gray-100">
                          <ul className="px-6 py-4 space-y-2 bg-white">
                            {groupedTests[category].map((test, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{test}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 sticky top-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Book This Test</h3>
                <Form pkgName={pkg.name} pkgRate={priceInfo.displayPrice} pkgId={code} />
              </div>
            </div>
          </div>
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
