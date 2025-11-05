import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminPanel from "./pages/AdminPanel";
import LoginPage from "./pages/LoginPage";
import PackageCatalog from "./components/catalog/Package.jsx";
import OfferCatalog from "./components/catalog/Offer.jsx";
import TestCatalog from "./components/catalog/Test.jsx";
import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportPage";
import OrdersPage from "./pages/OrderPage";
import AccountPage from "./pages/AccountPage";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="packages" element={<PackageCatalog />} />
          <Route path="offers" element={<OfferCatalog />} />
          <Route path="tests" element={<TestCatalog />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
