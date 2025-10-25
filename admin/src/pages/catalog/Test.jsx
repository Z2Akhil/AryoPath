import { useEffect, useState } from "react";
import AdminTable from "../../components/AdminTable";
import { getProducts } from "../../api/getProductApi"; // your getProducts function

const TestPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await getProducts("TEST");

        //Remove duplicates based on `code`
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {tests.length > 0 ? (
        <AdminTable
          data={tests}
          editableFields={["rate.offerRate"]} // optional
          onEdit={(item) => console.log("Edit:", item)}
        />
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No tests available.
        </p>
      )}
    </div>
  );
};

export default TestPage;
