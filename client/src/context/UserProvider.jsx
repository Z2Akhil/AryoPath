import { useState, useEffect } from 'react';
import { UserContext } from './userContext';
import authService from '../services/authService';

// This is the only export from this file
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching profile
          const profileResponse = await authService.getProfile();
          setUser(JSON.parse(savedUser));
        } catch (error) {
          // Token is invalid, clear storage
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Registration function with backend integration
  const register = async (name, phone, password, otp) => {
    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await authService.register(firstName, lastName, phone, password, otp);
      
      if (response.success) {
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName}`.trim(),
        };
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  // Login function with backend integration
  const login = async (phone, password) => {
    try {
      const response = await authService.login(phone, password);
      
      if (response.success) {
        const userData = {
          id: response.user.id,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: response.user.firstName ? `${response.user.firstName} ${response.user.lastName || ''}`.trim() : phone,
        };
        
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Request OTP function
  const requestOTP = async (mobileNumber, purpose = 'verification') => {
    try {
      const response = await authService.requestOTP(mobileNumber, purpose);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  // Verify OTP function
  const verifyOTP = async (mobileNumber, otp, purpose = 'verification') => {
    try {
      const response = await authService.verifyOTP(mobileNumber, otp, purpose);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'OTP verification failed');
    }
  };

  // Forgot password function
  const forgotPassword = async (mobileNumber) => {
    try {
      const response = await authService.forgotPassword(mobileNumber);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  // Reset password function
  const resetPassword = async (mobileNumber, otp, newPassword) => {
    try {
      const response = await authService.resetPassword(mobileNumber, otp, newPassword);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Password reset failed');
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    requestOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
