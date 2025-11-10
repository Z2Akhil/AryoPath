import { useState } from "react";
import { useSiteSettings } from "../context/SiteSettingsContext";

const Hero = () => {
  const { settings, loading, error } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  if (loading) {
    // Skeleton Loading State
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden md:flex mb-12 animate-pulse">
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
          <div className="flex flex-wrap gap-4">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <div className="md:w-1/2 h-64 md:h-auto min-h-[300px] bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading settings:", error);
  }

  // Decide which image to show
  const heroImage =
    !imgError && settings?.heroImage ? settings.heroImage : "./hero.jpg";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden md:flex mb-12">
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted Lab Tests, Right at Your Home
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          In association with ThyroCare, we bring NABL, CAP, and ISO certified
          lab services directly to you.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/tests"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Book a Test
          </a>
          <a
            href="/offers"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            View Offers
          </a>
        </div>
      </div>

      <div className="md:w-1/2 h-64 md:h-auto min-h-[300px]">
        <img
          src={heroImage}
          alt="Lab technician"
          onError={() => setImgError(true)} // fallback trigger
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Hero;
