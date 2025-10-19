// src/App.jsx

import React from 'react';
import { UserProvider } from './context/UserProvider'; // Import the provider

// Import Components
import Header from './components/Header';
import Footer from './components/Footer';

// Import Pages
import LandingPage from './pages/LandingPage';

function App() {
  return (
    // Wrap the entire application in the UserProvider
    // so all components (like Header) can access the user state
    <UserProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <LandingPage />
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}

export default App;