import React from "react";
import { Routes, Route } from "react-router-dom";
import HealthPackagesPage from "./components/Cards/HealthPackagesPage";
import HomePage from "./pages/HomePage";
import BookingForm from "./components/BookingForm";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/booking" element={<BookingForm />} />
      <Route path="/health-packages" element={<HealthPackagesPage allPackages={[]} />} />
    </Routes>
  );
}

export default App;
