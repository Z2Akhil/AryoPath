import { useEffect, useState } from "react";
import TestCard from "../components/cards/TestCard";
import { getProductsFromBackend } from "../api/backendProductApi"; // Use our backend API
import Pagination from "../components/Pagination";

const TestPage = ({ limit }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage,setCurrentPage]=useState(1);
  const [itemsPerPage,setItemsPerPage]=useState(12);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await getProductsFromBackend("TEST");

        const uniqueTests = Array.from(
          new Map(data.map((test) => [test.code, test])).values()
        );

        setTests(uniqueTests || []);
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
    return (
      <div className="text-center py-20 text-gray-500">
        Loading tests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  const totalItems=tests.length;
  const totalPages=Math.ceil(totalItems/itemsPerPage);
  const startIndex=(currentPage-1)*itemsPerPage;
  const endIndex=startIndex+itemsPerPage;
  const displayTests = limit ? tests.slice(0, limit) : tests.slice(startIndex,endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Tests
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayTests.length > 0 ? (
          displayTests.map((test) => (
            <TestCard key={test.code} test={test} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No tests available.
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

export default TestPage;
