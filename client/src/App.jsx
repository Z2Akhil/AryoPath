import React from 'react';
import { UserProvider } from './context/UserProvider'; 

// Import Components
import Header from './components/Header';
import Footer from './components/Footer';

// Import Pages
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="grow">
          {/* LandingPage is rendered directly */}
          <LandingPage />
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}

export default App;