import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import LandingPage from '@/pages/LandingPage';
import PackagePage from '@/pages/PackagePage';
import OfferPage from '@/pages/OfferPage';
import TestPage from '@/pages/TestPage';
import PackageDetailedPage from '@/pages/PackageDetailedPage';
import AboutPage from '@/pages/AboutPage';
import AccountPage from '@/pages/AccountPage';
import CartPage from '@/pages/CartPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OrderPage from '@/pages/OrderPage';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <UserProvider>
      <CartProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/packages" element={<PackagePage />} />
              <Route path="/packages/:code" element={<PackageDetailedPage />} />
              <Route path="/tests" element={<TestPage />} />
              <Route path="/offers" element={<OfferPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrderPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/popular-packages" element={<Navigate to="/packages" replace />} />
              <Route path="/all-tests" element={<Navigate to="/tests" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
