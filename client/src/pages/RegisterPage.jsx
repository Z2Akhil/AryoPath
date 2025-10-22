// src/components/RegisterForm.jsx

import React, { useState } from 'react';
import { User, Mail, Lock, Key } from 'lucide-react';
import { useUser } from '../context/userContext';

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
  const { register, requestOTP } = useUser(); // Get register function
  // Separate firstName and lastName state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false); // State to manage OTP step
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double clicks

  // Step 1: Request OTP
  const handleRequestOtp = async () => {
    setError('');
    setIsSubmitting(true);
    if (!firstName || !lastName || !phone || !password) {
      setError("Please fill in all fields before requesting OTP.");
      setIsSubmitting(false);
      return;
    }
     if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsSubmitting(false);
        return;
      }
    try {
      await requestOTP(phone, 'verification');
      setOtpSent(true); // Show OTP field
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please check the mobile number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit Registration with OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    if (!otp) {
        setError("Please enter the OTP.");
        setIsSubmitting(false);
        return
    }
    try {
      // Call the register function from context
      await register(firstName, lastName, phone, password, otp);
      onClose(); // Close modal on successful registration
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Use different handlers based on whether OTP is sent
    <form onSubmit={otpSent ? handleSubmit : (e) => { e.preventDefault(); handleRequestOtp(); }} className="space-y-5">
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {/* Fields shown before OTP is requested */}
      {!otpSent && (
        <>
          {/* First Name Input */}
          <div className="relative">
            <label className="sr-only">First Name</label>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              required={!otpSent} // Only required initially
              disabled={isSubmitting}
            />
          </div>

           {/* Last Name Input */}
          <div className="relative">
            <label className="sr-only">Last Name</label>
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              required={!otpSent}
              disabled={isSubmitting}
            />
          </div>

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
              required={!otpSent}
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
              placeholder="Create a password (min. 6 chars)"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              required={!otpSent}
              disabled={isSubmitting}
            />
          </div>
        </>
      )}


      {/* OTP Input (Shown only after OTP is requested) */}
      {otpSent && (
        <div className="relative">
          <label className="sr-only">OTP</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Key className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP received via SMS"
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            required={otpSent} // Required only in the second step
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Submit Button (Text changes based on step) */}
      <button
        type="submit"
        className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
          isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : (otpSent ? 'Verify OTP & Sign Up' : 'Send OTP')}
      </button>

      {/* Switch to Login Link */}
      <p className="text-sm text-center text-gray-600">
        Already a member?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline font-semibold"
          disabled={isSubmitting}
        >
          Login Now
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;