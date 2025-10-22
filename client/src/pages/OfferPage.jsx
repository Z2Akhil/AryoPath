import { useEffect, useState } from "react";
import OfferCard from "../components/cards/OfferCard";
import { getProducts } from "../api/productApi"; // your getProducts function

const OfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const data = await getProducts("OFFER"); // fetch OFFER products
        setOffers(data || []);
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
    return <div className="text-center py-20 text-gray-500">Loading offers...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Offers on Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {offers.length > 0 ? (
          offers.map((offer, index) => <OfferCard key={index} pkg={offer} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No offers available.
          </p>
        )}
      </div>
    </div>
  );
};

export default OfferPage;
