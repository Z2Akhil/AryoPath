import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HealthPackagesPage from './pages/HealthPackagesPage';
// You can create and import other pages here later
// import HomePage from './pages/HomePage'; 

function App() {
  return (
    <div>
    <HealthPackagesPage />
    <p>some text</p>
    </div>
  );
}

export default App;