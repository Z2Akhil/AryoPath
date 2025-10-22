import { useEffect, useState } from "react";
import PackageCard from "../components/cards/PackageCard";
import { getProducts } from "../api/productApi"; // your getProducts function

const PackagePage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getProducts("PROFILE"); // fetch PROFILE products
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

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading packages...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {packages.length > 0 ? (
          packages.map((pkg, index) => <PackageCard key={index} pkg={pkg} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No packages available.
          </p>
        )}
      </div>
    </div>
  );
};

export default PackagePage;
