import { useEffect, useState, useMemo } from "react";
import AdminTable from "../AdminTable";
import Pagination from "../Pagination";
import { getProducts } from "../../api/getProductApi";

const TestCatalog = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await getProducts("TEST");

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

  const paginatedTests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tests.slice(startIndex, endIndex);
  }, [tests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(tests.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {tests.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminTable
            data={paginatedTests}
            editableFields={["rate.offerRate"]}
            onEdit={(item) => console.log("Edit:", item)}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={tests.length}
          />
        </div>
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No tests available.
        </p>
      )}
    </div>
  );
};

export default TestCatalog;
