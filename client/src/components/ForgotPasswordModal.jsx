// src/components/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import { Mail, Key, Lock, CheckCircle } from 'lucide-react';
import { useUser } from '../context/userContext';
import Modal from './Modal'; // Use your generic modal

const ForgotPasswordModal = ({ onClose }) => {
  const { forgotPasswordRequestOtp, resetPasswordWithOtp } = useUser();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP & New Password, 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await forgotPasswordRequestOtp(phone);
      setMessage(`OTP sent to ${phone}. Enter it below.`);
      setStep(2); // Move to OTP entry step
    } catch (err) {
      setError(err.message || "Failed to send OTP. Is the number registered?");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
     if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
    setIsSubmitting(true);
    try {
      await resetPasswordWithOtp(phone, otp, newPassword);
      setMessage("Password reset successfully! You can now log in.");
      setStep(3); // Move to success step
      // Auto close after a delay
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Check OTP or try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine modal title based on step
  const getTitle = () => {
      switch(step) {
          case 1: return 'Forgot Password';
          case 2: return 'Reset Password';
          case 3: return 'Success!';
          default: return '';
      }
  }

  return (
    // Use a smaller modal for forgot password flow
    <Modal onClose={onClose} showCloseButton={step !== 3}>
      <div className="p-6 text-center max-w-sm mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">{getTitle()}</h3>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {message && step !== 3 && <p className="text-green-600 text-sm mb-4">{message}</p>}

        {/* Step 1: Enter Phone Number */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
             <p className="text-gray-600 text-sm mb-4">Enter your registered phone number to receive a password reset OTP.</p>
            <div className="relative">
              <label htmlFor="forgot-phone" className="sr-only">Phone Number</label>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="forgot-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP and New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
             <p className="text-gray-600 text-sm mb-4">Enter the OTP sent to {phone} and your new password.</p>
            <div className="relative">
              <label htmlFor="reset-otp" className="sr-only">OTP</label>
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Key className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="reset-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                required
                disabled={isSubmitting}
              />
            </div>
             <div className="relative">
              <label htmlFor="reset-password" className="sr-only">New Password</label>
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                 <Lock className="h-5 w-5 text-gray-400" />
               </span>
               <input
                 id="reset-password"
                 type="password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 placeholder="Enter new password (min. 6 chars)"
                 className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                 required
                 disabled={isSubmitting}
               />
            </div>
            <button
              type="submit"
              className={`w-full text-white py-3 rounded-md font-semibold text-lg transition duration-200 ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

         {/* Step 3: Success Message */}
         {step === 3 && (
            <div className="flex flex-col items-center text-green-600">
               <CheckCircle size={48} className="mb-4"/>
               <p className="text-lg font-semibold">{message}</p>
            </div>
         )}

      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;