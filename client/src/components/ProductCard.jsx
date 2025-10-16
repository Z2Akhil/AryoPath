import React from 'react';

const ProductCard = ({ product, onSelect }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer transition-transform duration-300 hover:scale-105"
      onClick={() => onSelect(product)}
    >
      {/* Image Section with Overlays */}
      <div className="relative">
        <img className="w-full h-40 object-cover" src={product.image} alt={product.name} />
        
        {/* Main Overlay Banner at the bottom of the image */}
        {product.overlayText && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-center">
            <span className="text-white font-bold text-sm uppercase">{product.overlayText}</span>
          </div>
        )}

        {/* Sample Type Tag at the top right */}
        {product.sampleType && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
            {product.sampleType}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600 mt-1 flex-grow">{product.description}</p>
        
        {/* Test Count Badge */}
        <div className="mt-4">
          <span className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
            {product.testCount} Tests
          </span>
        </div>
      </div>

      {/* Pricing and Booking Section */}
      <div className="p-4 border-t border-gray-200 flex justify-between items-center">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
            <span className="text-2xl font-bold text-teal-600">₹{product.price}</span>
            {product.discount && (
              <span className="text-green-600 font-semibold text-sm">{product.discount}</span>
            )}
          </div>
          {product.offerText && (
            <p className="text-xs text-gray-500 mt-1">{product.offerText}</p>
          )}
        </div>

        <button className="bg-blue-600 text-white font-bold px-5 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Book Now
        </button>
      </div>
    </div>
  );
};

export default ProductCard;