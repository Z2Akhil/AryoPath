import { useEffect, useState } from "react";
import TestCard from "../components/cards/TestCard";
import { getProducts } from "../api/productApi"; // Make sure this function exists

const TestPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        // Fetch tests by passing "Profile" instead of "OFFER"
        const data = await getProducts("TEST");
        setTests(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading tests...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Tests
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tests.length > 0 ? (
          tests.map((test, index) => <TestCard key={index} test={test} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">No tests available.</p>
        )}
      </div>
    </div>
  );
};

export default TestPage;
