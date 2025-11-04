import { useEffect, useState, useMemo } from "react";
import AdminTable from "../AdminTable";
import Pagination from "../Pagination";
import { getProducts } from "../../api/getProductApi";

const OfferCatalog = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await getProducts("OFFER");

        // The new API returns { success: true, products: [...] }
        const products = response.products || response || [];
        
        const uniqueOffers = Array.from(
          new Map(products.map((offer) => [offer.code, offer])).values()
        );
        setOffers(uniqueOffers || []);

      } catch (err) {
        console.error(err);
        setError("Failed to fetch offers");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return offers.slice(startIndex, endIndex);
  }, [offers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(offers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleEdit = (item) => {
    console.log("Edit offer:", item);
    // You can implement a modal for detailed editing here
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading offers...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {offers.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminTable
            data={paginatedOffers}
            onEdit={handleEdit}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={offers.length}
          />
        </div>
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No offers available.
        </p>
      )}
    </div>
  );
};

export default OfferCatalog;
