import React from 'react';
// 1. Import Routes and Route from react-router-dom
import { Routes, Route } from "react-router-dom";

// 2. Import your pages and components using relative paths
import PackagePage from './pages/PackagePage';
import OfferPage from './pages/OfferPage';
import TestPage from './pages/TestPage';
import Header from './components/Header';
import { UserProvider } from './context/UserProvider';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <UserProvider>
      <Header />
      
      {/* 3. Set up your routes */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/packages" element={<PackagePage />} />
          <Route path="/offers" element={<OfferPage />} />
          <Route path="/tests" element={<TestPage />} />
        </Routes>
      </main>

      <Footer />
    </UserProvider>
  );
}

export default App;