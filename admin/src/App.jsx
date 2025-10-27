import { Routes, Route } from "react-router-dom";
import AdminPanel from "./pages/AdminPanel";
import PackageCatalog from "./components/catalog/Package.jsx";
import OfferCatalog from "./components/catalog/Offer.jsx";
import TestCatalog from "./components/catalog/Test.jsx";
import HomePage from "./pages/HomePage";
import ReportsPage from "./pages/ReportPage";
import OrdersPage from "./pages/OrderPage";
import SettingsPage from "./pages/SettingsPage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminPanel />}>
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="packages" element={<PackageCatalog />} />
        <Route path="offers" element={<OfferCatalog />} />
        <Route path="tests" element={<TestCatalog />} />
      </Route>
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
