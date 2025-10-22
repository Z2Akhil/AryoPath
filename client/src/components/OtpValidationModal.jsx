// src/components/OtpValidationModal.jsx
import React, { useState } from 'react';
import { Key, CheckCircle, X } from 'lucide-react'; // Added X for close button
import Modal from './Modal'; // Use your generic Modal component
import { useUser } from '../context/userContext'; // Import useUser to call register

// Receives user details (fName, lName, phone, pwd) and the main onClose handler
const OtpValidationModal = ({ firstName, lastName, mobileNumber, password, onClose, onRegisterSuccess }) => {
  const { register } = useUser(); // Get register function from context
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handles clicking the "Verify & Register" button
  const handleFinalRegister = async (e) => {
     e.preventDefault();
     if (!otp || otp.length !== 6) {
       setError("Please enter the 6-digit OTP.");
       setIsSuccess(false);
       return;
     }
     setError('');
     setIsSubmitting(true);
     setIsSuccess(false);

     try {
       // Call the final register endpoint with all data
       await register(firstName, lastName, mobileNumber, password, otp);
       setIsSuccess(true); // Show green tick
       // Call the success handler passed from AuthModal (which will close both modals)
       setTimeout(onRegisterSuccess, 1200); // Show tick for 1.2 seconds before closing
     } catch (err) {
       setError(err.message || "Registration failed. Invalid OTP or user may exist?");
       setIsSuccess(false);
     } finally {
        setIsSubmitting(false);
     }
  };

  return (
    // Use a smaller modal, solid white background for this step
    <Modal onClose={isSuccess ? undefined : onClose} showCloseButton={!isSuccess}> {/* Disable close during/after success */}
      <div className="p-6 text-center max-w-sm mx-auto bg-white rounded-lg">
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          {isSuccess ? 'Registration Successful!' : 'Verify OTP'}
        </h3>

        {!isSuccess && (
          <p className="text-gray-600 mb-4">
            Enter the 6-digit code sent to {mobileNumber}
          </p>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {isSuccess ? (
             <div className="flex flex-col items-center text-green-600 py-3">
               <CheckCircle size={48} className="mb-3"/>
               <span>You can now log in.</span>
             </div>
        ) : (
          <form onSubmit={handleFinalRegister} className="space-y-4">
            <div className="relative">
              <label htmlFor="otp-input-modal-final" className="sr-only">OTP</label>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="otp-input-modal-final"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                maxLength={6}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 text-center tracking-widest text-lg"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit" // Submit triggers handleFinalRegister
              className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Register'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default OtpValidationModal;