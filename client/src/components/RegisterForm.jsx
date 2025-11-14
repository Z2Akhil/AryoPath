import { useState } from 'react';
import { useUser } from '../context/userContext';
import { useToast } from '../context/ToastContext';
import { User, Phone, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';

const RegisterForm = ({ onClose, onSwitchToLogin }) => {
  const { register, requestOTP, verifyOTP } = useUser();
  const { info, success, error: toastError } = useToast();
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP verification
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      setError('Mobile number is required');
      return false;
    }
    if (formData.mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRequestOTP = async () => {
    if (!validateStep1()) return;

    setOtpLoading(true);
    setError('');

    try {
      await requestOTP(formData.mobileNumber, 'verification');
      setOtpSent(true);
      setStep(2);
      startCountdown();
      info(`OTP has been sent to ${formData.mobileNumber}`);
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setOtpLoading(true);
    setError('');

    try {
      await requestOTP(formData.mobileNumber, 'verification');
      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      handleRequestOTP();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await register(fullName, formData.mobileNumber, formData.password, formData.otp);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {step === 1 ? 'Create Account' : 'Verify OTP'}
        </h2>
        <p className="text-gray-600">
          {step === 1
            ? 'Join AryoPath for comprehensive health services'
            : `Enter the OTP sent to ${formData.mobileNumber}`
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500 transition-all duration-200 bg-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 
                         text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                         font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* OTP Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP *
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-lg
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                           focus:border-blue-500 transition-all duration-200 bg-white font-mono"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || otpLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                >
                  {otpLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin inline" />
                  ) : countdown > 0 ? (
                    `Resend OTP in ${countdown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Change number
                </button>
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-600 to-green-700 
                         text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none 
                         focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 
                         font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Verify & Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg 
                     hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 transition-all duration-200 font-medium"
        >
          Sign In to Existing Account
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
