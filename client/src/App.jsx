import { UserProvider } from './context/UserProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import TestPage from './pages/TestPage';
import OfferPage from './pages/OfferPage';

function App() {
  return (
    <UserProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <LandingPage />
          <TestPage />
          <OfferPage />
        </main>
        <Footer />
      </div>
    </UserProvider>
  );
}

export default App;