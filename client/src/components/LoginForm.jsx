// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useUser } from '../context/userContext';
import ForgotPasswordModal from './ForgotPasswordModal'; // Import the modal

const LoginForm = ({ onClose, onSwitchToRegister }) => {
  const { login } = useUser();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // State for modal

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(phone, password);
      onClose();
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {/* Phone Input */}
        <div className="relative">
          <label className="sr-only">Phone Number</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Mail className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
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

        {/* Forgot Password Button */}
         <div className="text-right text-sm">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)} // Open Forgot Password Modal
              className="font-medium text-blue-600 hover:text-blue-500"
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
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

       {/* Conditionally render Forgot Password Modal */}
       {showForgotPassword && (
         <ForgotPasswordModal
           onClose={() => setShowForgotPassword(false)}
         />
       )}
    </>
  );
};

export default LoginForm;