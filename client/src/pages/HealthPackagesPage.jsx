import React, { useState } from 'react';
import BookingForm from '../components/BookingForm';
import ProductCard from '../components/ProductCard';

// --- DUMMY DATA ---
// This is our single source of truth for now.
// In src/pages/HealthPackagesPage.jsx

// --- NEW DUMMY DATA ---
const dummyProducts = [
    { 
      id: 'PROJ456', 
      type: 'offer', 
      name: 'Executive Full Body Health Checkup', 
      price: 1579, 
      originalPrice: 3200,
      discount: '50% off',
      description: 'Thyrocare Executive Full Body Health Checkup includes Diagnostics lab tests Like complete urine analysis, electrolytes, renal, liver, lipid etc.',
      testCount: 127,
      image: 'https://via.placeholder.com/400x200/5B9BD5/FFFFFF?text=Doctor+and+Family', // Placeholder image
      overlayText: 'EXECUTIVE FULL BODY HEALTH CHECKUP',
      sampleType: 'Blood & Urine',
      offerText: 'Rs. 1479 per person for 2 or more'
    },
    { 
      id: 'PROJ789', 
      type: 'profile', 
      name: 'Extensive Checkup with All Vitamins', 
      price: 2679, 
      originalPrice: 5500,
      discount: '51% off',
      description: 'Thyrocare Extensive Full Body Health Checkup includes Diagnostics lab tests Like All 14 Vitamins, cancer markers, elements, renal, liver, lipid etc.',
      testCount: 127,
      image: 'https://via.placeholder.com/400x200/ED7D31/FFFFFF?text=Vitamins+and+Doctor', // Placeholder image
      overlayText: 'EXTENSIVE HEALTH CHECKUP WITH 14 VITAMINS',
      sampleType: 'Blood & Urine',
      offerText: 'Rs. 2479 per person for 2 or more'
    },
    { 
      id: 'AAROGYAM_B', 
      type: 'test', 
      name: 'Aarogyam Basic', 
      price: 979, 
      originalPrice: 1600,
      discount: '38% off',
      description: 'Tests for screening of the health status Like Lipid, Liver, Thyroid, Diabetic, CBC, Iron, Kidney, Vitamins.',
      testCount: 66,
      image: 'https://via.placeholder.com/400x200/FFC000/FFFFFF?text=Happy+Couple', // Placeholder image
      overlayText: 'AAROGYAM BASIC',
      sampleType: 'Blood',
      offerText: 'Rs. 899 per person for 2 or more'
    },
  ];
  // --- END OF NEW DUMMY DATA ---

// --- Component Setup ---
const NavButton = ({ children, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

const HealthPackagesPage = () => {
  // Initialize state directly from our dummy data
  const [products] = useState(dummyProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentView, setCurrentView] = useState('all');

  // Filter products based on the current navigation view
  const filteredProducts = products.filter(product => {
    if (currentView === 'all') return true;
    return product.type === currentView;
  });

  // --- Main Render Logic ---

  // If a product has been selected, show the booking form
  if (selectedProduct) {
    return (
      <div className="bg-gray-900 min-h-screen py-10 px-4">
        <BookingForm
          packageName={selectedProduct.name}
          packagePrice={selectedProduct.price}
        />
        <div className="text-center mt-6">
          <button
            onClick={() => setSelectedProduct(null)}
            className="text-blue-400 underline hover:text-blue-300"
          >
            &larr; Back to all products
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the main page with product cards
  return (
    <div className="p-6 sm:p-10 bg-gray-900 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">Our Health Services</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">Choose from a wide range of tests, profiles, and health packages to suit your needs.</p>
      </div>

      <div className="flex justify-center items-center gap-2 sm:gap-4 mb-10">
        <NavButton onClick={() => setCurrentView('all')} isActive={currentView === 'all'}>All</NavButton>
        <NavButton onClick={() => setCurrentView('offer')} isActive={currentView === 'offer'}>Offers</NavButton>
        <NavButton onClick={() => setCurrentView('profile')} isActive={currentView === 'profile'}>Profiles</NavButton>
        <NavButton onClick={() => setCurrentView('test')} isActive={currentView === 'test'}>Tests</NavButton>
      </div>
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onSelect={setSelectedProduct}
          />
        ))}
      </div>
    </div>
  );
};

export default HealthPackagesPage;