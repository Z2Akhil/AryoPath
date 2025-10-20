// src/components/LoginForm.jsx

import React, { useState } from 'react';
import { useUser } from '../context/userContext';

const LoginForm = ({ onClose, onSwitchToRegister }) => {
  const { login } = useUser();
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(phone, password);
      onClose(); // Close modal on successful login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Phone Number:</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <button type="submit" className="w-full bg-blue-500 text-white py-2.5 rounded-md hover:bg-blue-600 font-medium">
        Login
      </button>
      
      <p className="text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-500 hover:underline font-medium"
        >
          Register
        </button>
      </p>
    </form>
  );
};

export default LoginForm;