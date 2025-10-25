import { useEffect, useState } from "react";
import AdminTable from "../../components/AdminTable";
import { getProducts } from "../../api/getProductApi"; // your getProducts function

const OfferPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const data = await getProducts("OFFER"); // fetch OFFER products

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
    return <div className="text-center py-20 text-gray-500">Loading offers...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {offers.length > 0 ? (
        <AdminTable
          data={offers}
          editableFields={["rate.offerRate"]} // optional
          onEdit={(item) => console.log("Edit:", item)}
        />
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No offers available.
        </p>
      )}
    </div>
  );
};

export default OfferPage;
