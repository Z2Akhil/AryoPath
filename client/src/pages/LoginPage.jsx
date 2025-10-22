// src/components/LoginForm.jsx

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useUser } from '../context/userContext'; // Ensure this path is correct

const LoginForm = ({ onClose, onSwitchToRegister }) => {
  // Get login function from context
  const { login } = useUser();
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double clicks

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      // Call the login function from context
      await login(phone, password);
      onClose(); // Close modal on successful login
    } catch (err) {
      // Display error message from backend or a generic one
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Phone/Email Input */}
      <div className="relative">
        <label className="sr-only">Phone Number or Email</label>
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Mail className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your email or phone"
          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <label className="sr-only">Password</label>
         <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Lock className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
           placeholder="Enter your password"
          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <input id="remember-me-login" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="remember-me-login" className="ml-2 block text-gray-700"> Remember me </label>
        </div>
        <a href="#" className="font-medium text-blue-600 hover:text-blue-500"> Forgot password? </a>
      </div>

      {/* Login Button (Blue) */}
      <button
        type="submit"
        className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Logging in...' : 'Login Now'}
      </button>

      {/* Switch to Register Link */}
      <p className="text-sm text-center text-gray-600">
        Not a member?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:underline font-semibold"
          disabled={isSubmitting}
        >
          Signup Now
        </button>
      </p>
    </form>
  );
};

export default LoginForm;