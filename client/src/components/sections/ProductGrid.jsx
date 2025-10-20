import React from 'react';
import PackageCard from '../cards/PackageCard';

// A reusable component to show a grid of products
const ProductGrid = ({ title, products, seeAllLink = "#" }) => {
  return (
    <div className="my-12">
      {/* Section Header with "See All" */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <a 
          href={seeAllLink}
          className="text-blue-600 font-medium hover:underline"
        >
          See All
        </a>
      </div>
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((pkg, index) => (
          <PackageCard
            key={pkg.rate?.id || `${pkg.code}-${index}`}
            pkg={pkg}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;