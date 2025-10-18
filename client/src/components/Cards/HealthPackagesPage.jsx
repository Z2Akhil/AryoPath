import React, { useState } from "react";
import HealthPackageCard from "./HealthPackageCard"; // Make sure the path is correct

// This is the new component that will manage the pages
const HealthPackagesPage = ({ allPackages = [] }) => {
  // Ensure allPackages is always an array
  const packages = Array.isArray(allPackages) ? allPackages : [];
  
  // 1. State for the current page number
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 20; // Set the number of cards per page

  // 2. Calculate the cards to display for the current page
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = packages.slice(indexOfFirstCard, indexOfLastCard);

  // 3. Calculate total number of pages
  const totalPages = Math.ceil(packages.length / cardsPerPage);

  // Functions to change the page
  const goToNextPage = () => {
    // Go to the next page, but not past the last one
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  const goToPreviousPage = () => {
    // Go to the previous page, but not before the first one
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  return (
    <div>
      {/* Grid to display the cards for the current page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {currentCards.length === 0 ? (
          <p className="text-center text-gray-500 col-span-4">No packages to display on this page.</p>
        ) : (
          currentCards.map((pkg, index) => (
            <HealthPackageCard 
              key={pkg.rate?.id || pkg.id || pkg.code || `pkg-${index}`} 
              pkg={pkg} 
            />
          ))
        )}
      </div>

      {/* 4. Pagination Controls */}
      <div className="flex justify-center items-center gap-4 my-8">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1} // Disable button on the first page
          className="bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Previous
        </button>

        <span className="text-gray-700 font-semibold">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages} // Disable button on the last page
          className="bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HealthPackagesPage;