import { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HealthPackagesPage from "../components/Cards/HealthPackagesPage";

const HomePage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // HomePage delegates pagination & rendering to HealthPackagesPage

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        console.log("🔄 Fetching packages...");
        const response = await axios.post(
          "/api/productsmaster/Products",
          {
            ApiKey: "0L75qPMP5vuCdSLQ@Gs2hlYPyX7af7Ru.eRAxbxWKc63ma2fq4CD@oQ==",
            ProductType: "Test",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data;
        console.log("📦 API Response:", data);

        if (data.response === "Success" && data.master) {
          // Extract and normalize data from possible locations
          const raw = data.master.profile || data.master.offer || data.master.tests || [];
          const packagesData = Array.isArray(raw) ? raw : Object.values(raw || {});
          
          console.log(`✅ Found ${packagesData.length} packages`);
          console.log("📝 Sample package:", packagesData[0]);
          
          setPackages(packagesData);
          setError(null);
        } else {
          console.warn("⚠️ API response was not successful:", data);
          setError("No packages found in API response");
          setPackages([]);
        }
      } catch (error) {
        console.error("❌ Error fetching packages:", error);
        setError(error.message || "Error fetching packages");
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Work with a guaranteed array copy
  const packagesList = Array.isArray(packages) ? packages : [];

  // pagination state (kept in page component)
  // HomePage delegates rendering + pagination to HealthPackagesPage

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Health Packages
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center">Loading packages...</p>
        ) : packagesList.length === 0 ? (
          <p className="text-red-500 text-center">No packages found or there was an error. Check console for API response.</p>
        ) : (
          <div>
            {/* Show package count for debugging */}
            <p className="text-sm text-gray-500 mb-4">Found {packagesList.length} packages</p>
            
            {/* Delegate rendering + pagination (20 per page) to HealthPackagesPage */}
            <HealthPackagesPage allPackages={packagesList} />
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HomePage;