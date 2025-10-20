// src/pages/LandingPage.jsx

import React from 'react';
import { dummyCatalogData } from '../components/data/dummyData'; // Import the dummy data

// Import sections
import Hero from '../components/sections/Hero';
import HomeCarousel from '../components/sections/HomeCarousel';
import ProductGrid from '../components/sections/ProductGrid';

const LandingPage = () => {
  // [cite_start]// Extract the arrays from the dummy data [cite: 214-221]
  const offers = dummyCatalogData.master.offer;
  const packages = dummyCatalogData.master.profile; // "Profile" is your "Package"
  const tests = dummyCatalogData.master.tests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      
      {/* 1. Hero Section (Photo + Text) */}
      <Hero />
      
      {/* 2. Carousel Section */}
      <HomeCarousel />
      
      {/* 3. Offer Section */}
      <ProductGrid 
        title="Top Offers" 
        products={offers} 
        seeAllLink="/offers" 
      />
      
      {/* 4. Package (Profile) Section */}
      <ProductGrid 
        title="Popular Packages" 
        products={packages} 
        seeAllLink="/packages" 
      />
      
      {/* 5. Test Section (as seen in your sketch) */}
      <ProductGrid 
        title="Featured Tests" 
        products={tests} 
        seeAllLink="/tests" 
      />

    </div>
  );
};

export default LandingPage;