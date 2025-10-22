// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { User, Phone, Lock } from 'lucide-react'; // Key icon removed
import { useUser } from '../context/userContext';
import OtpValidationModal from './OtpValidationModal'; // Import the OTP modal

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
  const { requestOTP } = useUser(); // Only need requestOTP here
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  // Step 1: Validate fields and Request OTP via API
  const handleRequestOtp = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError('');

    // --- Validation ---
    if (!fullName.trim() || !phone.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // --- End Validation ---

    setIsRequestingOtp(true);
    try {
      console.log("Requesting OTP for:", phone);
      await requestOTP(phone, 'verification');
      console.log("OTP Request successful, opening modal.");
      setIsOtpModalOpen(true); // Open the OTP modal on success
      setError('');
    } catch (err) {
      console.error("OTP Request API call failed:", err);
      setError(err.message || "Failed to send OTP. Check number or try again later.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // This function is passed to OtpValidationModal to handle closing everything on success
  const handleRegistrationSuccess = () => {
    setIsOtpModalOpen(false); // Close OTP modal
    onClose(); // Close the main AuthModal
  };

  const isSubmitting = isRequestingOtp; // Only one loading state needed here now

  return (
    <>
      {/* Main Form's onSubmit now ONLY requests OTP */}
      <form onSubmit={handleRequestOtp} className="space-y-5">
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {/* Input Fields (No changes needed here) */}
        {/* Full Name */}
        <div className="relative">
          <label className="sr-only">Full Name</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><User className="h-5 w-5 text-gray-400" /></span>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" required disabled={isSubmitting} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"/>
        </div>
        {/* Phone */}
        <div className="relative">
          <label className="sr-only">Phone Number</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Phone className="h-5 w-5 text-gray-400" /></span>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter your 10-digit phone number" required disabled={isSubmitting} maxLength={10} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"/>
        </div>
        {/* Password */}
        <div className="relative">
          <label className="sr-only">Password</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="h-5 w-5 text-gray-400" /></span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password (min. 6 chars)" required disabled={isSubmitting} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"/>
        </div>
        {/* Confirm Password */}
        <div className="relative">
          <label className="sr-only">Confirm Password</label>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="h-5 w-5 text-gray-400" /></span>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required disabled={isSubmitting} className={`w-full pl-10 pr-3 py-2.5 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${ password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-gray-300' }`}/>
        </div>

        {/* Button ONLY Requests OTP */}
        <button
          type="submit" // Submitting the form triggers handleRequestOtp
          className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
            isRequestingOtp ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700' // Use blue color
          }`}
          disabled={isRequestingOtp}
        >
          {isRequestingOtp ? 'Sending OTP...' : 'Send OTP & Continue'}
        </button>

        {/* Switch to Login Link */}
        <p className="text-sm text-center text-gray-600">
          Already a member?{' '}
          <button type="button" onClick={onSwitchToLogin} className="text-blue-600 hover:underline font-semibold" disabled={isSubmitting}>
            Login Now
          </button>
        </p>
      </form>

      {/* OTP Modal triggered by state */}
      {isOtpModalOpen && (
        <OtpValidationModal
          // Pass necessary data to the OTP modal
          firstName={fullName.trim().split(' ')[0] || ''}
          lastName={fullName.trim().split(' ').slice(1).join(' ') || (fullName.trim().split(' ')[0] || '')}
          mobileNumber={phone}
          password={password}
          onClose={() => setIsOtpModalOpen(false)}
          onRegisterSuccess={handleRegistrationSuccess} // Pass the success handler
        />
      )}
    </>
  );
};

export default RegisterForm;