import React, { useState, useEffect } from 'react';
import { UserContext } from './userContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true);

  // Effect to verify token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Using /dashboard to verify token validity
          const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            // **MODIFIED:** Set user state ONLY with data from /dashboard
            setUser({
              id: data.user.id,
              mobileNumber: data.user.mobileNumber,
              // Names are NOT available from this endpoint
            });
            console.log('Auth check successful, user set (no names):', data.user);
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // Finished initial check
    };
    checkAuth();
  }, [token]); // Re-run effect if the token changes

  // --- API Call Functions ---

  const requestOTP = async (mobileNumber, purpose = 'verification') => {
    // ... (No changes needed) ...
     try {
      const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, purpose }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to request OTP');
      }
      console.log('OTP Requested:', data);
      return data;
    } catch (error) {
      console.error("Request OTP error:", error);
      throw error;
    }
  };

  const register = async (firstName, lastName, mobileNumber, password, otp) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, mobileNumber, password, otp }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      // **IMPORTANT:** /register DOES return names, so set them here
      setUser(data.user); // Contains id, firstName, lastName, mobileNumber, isVerified
      console.log('Registration successful, user set (with names):', data.user);
      return data;
    } catch (error) {
      console.error("Registration API error:", error);
      throw error;
    }
  };

  const login = async (mobileNumber, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      // **MODIFIED:** Set user state ONLY with data from /login
      setUser({
        id: data.user.id,
        mobileNumber: data.user.mobileNumber,
        isVerified: data.user.isVerified
        // Names are NOT available from this endpoint
      });
      console.log('Login successful, user set (no names):', data.user);
      return data;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  };

  const forgotPasswordRequestOtp = async (mobileNumber) => {
    // ... (No changes needed) ...
     try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send reset OTP');
      }
      console.log('Forgot Password OTP Requested:', data);
      return data;
    } catch (error) {
      console.error("Forgot Password OTP request error:", error);
      throw error;
    }
  };

  const resetPasswordWithOtp = async (mobileNumber, otp, newPassword) => {
    // ... (No changes needed) ...
     try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }
       console.log('Password Reset successful:', data);
      return data;
    } catch (error) {
      console.error("Reset Password error:", error);
      throw error;
    }
  };

  const logout = () => {
    // ... (No changes needed) ...
     localStorage.removeItem('authToken');
     setToken(null);
     setUser(null);
     console.log("User logged out");
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    requestOTP,
    forgotPasswordRequestOtp,
    resetPasswordWithOtp,
  };

  if (loading) {
      return <div>Loading...</div>; // Or a spinner component
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};