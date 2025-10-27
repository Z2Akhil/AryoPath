import { useEffect, useState } from "react";
import AdminTable from "../../components/AdminTable";
import { getProducts } from "../../api/getProductApi"; // your getProducts function

const PackageCatalog = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getProducts("PROFILE"); // fetch PROFILE products

        const uniquePackages = Array.from(
          new Map(data.map((pkg) => [pkg.code, pkg])).values()
        )

        setPackages(uniquePackages || []);

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
      {packages.length > 0 ? (
        <AdminTable
          data={packages}
          editableFields={["rate.offerRate"]} // optional
          onEdit={(item) => console.log("Edit:", item)}
        />
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No packages available.
        </p>
      )}
    </div>

  );
};

export default PackageCatalog;
