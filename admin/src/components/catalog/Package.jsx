import { useEffect, useState, useMemo } from "react";
import AdminTable from "../../components/AdminTable";
import Pagination from "../../components/Pagination";
import { getProducts } from "../../api/getProductApi";

const PackageCatalog = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getProducts("PROFILE");

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

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return packages.slice(startIndex, endIndex);
  }, [packages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(packages.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading packages...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {packages.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminTable
            data={paginatedPackages}
            editableFields={["rate.offerRate"]} // optional
            onEdit={(item) => console.log("Edit:", item)}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={packages.length}
          />
        </div>
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No packages available.
        </p>
      )}
    </div>

  );
};

export default PackageCatalog;
