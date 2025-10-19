import TestCard from "../components/cards/TestCard";

const TestPage = () => {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Tests 
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Render hardcoded card(s) directly */}
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
          <TestCard />
        </div>
      </div>
    </>
  );
};

export default TestPage;