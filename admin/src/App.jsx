import { Routes, Route } from "react-router-dom";
import AdminPanel from "./pages/AdminPanel";
import PackagesPage from "./pages/catalog/Package.jsx";
import OffersPage from "./pages/catalog/Offer.jsx";
import TestsPage from "./pages/catalog/Test.jsx";
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
        <Route path="packages" element={<PackagesPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="tests" element={<TestsPage />} />
      </Route>
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
