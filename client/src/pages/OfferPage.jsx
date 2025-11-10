import { useEffect, useState } from "react";
import OfferCard from "../components/cards/OfferCard";
import SkeletonOfferCard from "../components/cards/SkeletonOfferCard";
import { getProductsFromBackend } from "../api/backendProductApi"; // Use our backend API
import Pagination from "../components/Pagination";

const OfferPage = ({limit}) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage,setCurrentPage]=useState(1);
  const [itemsPerPage,setItemsPerPage]=useState(12);
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const data = await getProductsFromBackend("OFFER");

        const uniqueOffers = Array.from(
          new Map(data.map((offer) => [offer.code, offer])).values()
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Offers on Health Packages
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: limit || 8 }).map((_, index) => (
            <SkeletonOfferCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

const totalItems=offers.length;
const totalPages=Math.ceil(totalItems/itemsPerPage);
const startIndex=(currentPage-1)*itemsPerPage;
const endIndex=startIndex+itemsPerPage;

const displayOffers=limit ? offers.slice(0,limit):offers.slice(startIndex,endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Offers on Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayOffers.length > 0 ? (
          displayOffers.map((offer, index) => <OfferCard key={index} pkg={offer} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No offers available.
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

export default OfferPage;
