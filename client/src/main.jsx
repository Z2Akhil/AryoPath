import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Make sure this import is here
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Make sure <App /> is wrapped like this */}
      <App /> 
  </React.StrictMode>
);