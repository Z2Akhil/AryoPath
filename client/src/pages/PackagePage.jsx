import { useEffect, useState } from "react";
import PackageCard from "../components/cards/PackageCard";
import { getProductsFromBackend } from "../api/backendProductApi"; // Use our backend API
import Pagination from "../components/Pagination";

const PackagePage = ({limit}) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const[currentPage,setCurrentPage]=useState(1);
  const [itemsPerPage,setItemsPerPage]=useState(12);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await getProductsFromBackend("PROFILE"); // fetch PROFILE products from our backend

        const uniquePackages=Array.from(
          new Map(data.map((pkg)=>[pkg.code,pkg])).values()
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
  
  const totalItems=packages.length;
  const totalPages=Math.ceil(totalItems/itemsPerPage);
  const startIndex=(currentPage-1)*itemsPerPage;
  const endIndex=startIndex+itemsPerPage;
  const displayedPackages = limit ? packages.slice(0, limit) : packages.slice(startIndex,endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayedPackages.length > 0 ? (
          displayedPackages.map((pkg, index) => <PackageCard key={index} pkg={pkg} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No packages available.
          </p>
        )}
      </div>
   {!limit && totalItems>itemsPerPage && totalPages>1&&(
      <div className=" mt-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalItems={totalItems}
        />
      </div>
     )}
    </div>
  );
};

export default PackagePage;
