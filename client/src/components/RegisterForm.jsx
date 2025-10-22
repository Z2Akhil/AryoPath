// src/components/RegisterForm.jsx

import React, { useState } from 'react';
// Removed icon imports
import { useUser } from '../context/userContext';

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
  const { register } = useUser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, phone, password, otp);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Name Input */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          // MODIFIED: Simpler input style
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      {/* Phone Input */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          // MODIFIED: Simpler input style
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      {/* Password Input */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Create Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a password"
          // MODIFIED: Simpler input style
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      {/* OTP Input */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">OTP</label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP (use '123456')"
          // MODIFIED: Simpler input style
          className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
        />
      </div>

      {/* Register Button (Green) */}
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-semibold text-lg transition duration-200"
      >
        Sign Up
      </button>

      {/* Switch to Login Link */}
      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline font-semibold"
        >
          Login
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;