// src/pages/LandingPage.jsx
import React from 'react';
import { dummyCatalogData } from '../data/dummyData'; // Import the dummy data

// Import sections
import Hero from '../sections/Hero';
import HomeCarousel from '../sections/HomeCarousel';
import ProductGrid from '../sections/ProductGrid';

const LandingPage = () => {
  const offers = dummyCatalogData.master.offer;
  const packages = dummyCatalogData.master.profile;
  const tests = dummyCatalogData.master.tests;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      
      <Hero />
      
      <HomeCarousel />
      
      <ProductGrid 
        title="Top Offers" 
        products={offers} 
        seeAllLink="#" 
      />
      
      <ProductGrid 
        title="Popular Packages" 
        products={packages} 
        seeAllLink="#" 
      />
      
      <ProductGrid 
        title="Featured Tests" 
        products={tests} 
        seeAllLink="#" 
      />

    </div>
  );
};

export default LandingPage;