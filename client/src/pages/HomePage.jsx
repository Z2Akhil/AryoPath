import { useEffect, useState } from "react";
import axios from "axios";
import HealthPackageCard from "../components/Cards/HealthPackageCard";
import Header from "@/components/Header";

const HomePage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchPackages = async () => {
    try {
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
      console.log("✅ Full API Response:", response.data);

      // Handle the correct API data structure
      const data = response.data;
      
      if (data.response === "Success" && data.master) {
        // Check multiple possible data locations
        const packagesData = 
          data.master.profile || 
          data.master.offer || 
          data.master.tests || 
          [];
        
        console.log("📦 Total packages found:", packagesData.length);
        setPackages(packagesData);
      } else {
        console.warn("⚠️ Unexpected API response:", data);
        setPackages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching packages:", error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  fetchPackages();
}, []);

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Health Packages
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading packages...</p>
        ) : packages.length === 0 ? (
          <p className="text-red-500">No packages found or invalid API key.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {packages.map((pkg,index) => (
              <HealthPackageCard key={pkg.rate?.id || `${pkg.code}-${index}`} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HomePage;