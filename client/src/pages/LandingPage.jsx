import PackageCard from "../components/cards/PackageCard";

// --- FIX 1: 'packageData' is now defined ---
// This is the array your component was missing.
const packageData = [
  {
    name: "HEMOGRAM - 6 PART (DIFF)",
    code: "P187",
    testCount: "30",
    bookedCount: "549",
    category: "WELLNESS",
    specimenType: "EDTA",
    fasting: "NF",
    rate: {
      b2B: "75",
      b2C: "314",
      offerRate: "310",
      id: "3273",
      payAmt: "314",
    },
    imageLocation:
      "http://b2capi.thyrocare.com/wellness/img/Banner/P187_banner.jpg",
    imageMaster: [
      {
        imgLocations:
          "https://b2capi.thyrocare.com/API_Beta/Images/B2C/PROFILE/P187/HEMOGRAM - 6 PART (DIFF)_INDEX.JPG",
        id: "1",
      },
    ],
  },
  {
    name: "Advanced Health Checkup",
    code: "P200",
    testCount: "50",
    bookedCount: "720",
    category: "ADVANCED",
    specimenType: "SERUM, EDTA",
    fasting: "CF", // Compulsory Fasting
    rate: {
      b2B: "1500",
      b2C: "3000",
      offerRate: "2499",
      id: "3274",
      payAmt: "2499",
    },
    imageLocation:
      "https://via.placeholder.com/400x200?text=Advanced+Checkup",
    imageMaster: [],
  },
];
// -------------------------------------------

const LandingPage = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Health Packages
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* This .map() now works correctly */}
          {packageData.map((pkg, index) => (
            <PackageCard
              key={pkg.rate?.id || `${pkg.code}-${index}`}
              pkg={pkg} // This prop will now be received by PackageCard
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default LandingPage;