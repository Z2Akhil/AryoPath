// src/context/UserProvider.jsx
import React, { useState, useEffect } from 'react';
import { UserContext } from './userContext';
import authService from '../services/authService'; // Assuming you have this service layer

// This is the only export from this file
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Existing Authentication Logic (UNCHANGED from your version) ---

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching profile
          // NOTE: This call only verifies. State is set from localStorage below.
          await authService.getProfile();
          setUser(JSON.parse(savedUser)); // Set state from localStorage
        } catch (error) {
          // Token is invalid, clear storage
          console.error("Auth check failed:", error.message);
          authService.logout(); // Clears localStorage token and user
          setUser(null);        // Ensure state is cleared
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []); // Run only once on mount

  // Registration function with backend integration
  const register = async (name, phone, password, otp) => {
    try {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || ''; // Changed default to empty string

      const response = await authService.register(firstName, lastName, phone, password, otp);

      if (response.success && response.user) { // Added check for user object
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName || ''}`.trim(), // Ensure lastName might be empty
        };
        // authService.register should handle saving the token
        localStorage.setItem('user', JSON.stringify(userData)); // Save full user data
        setUser(userData); // Update state
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Register function error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  // Login function with backend integration
  const login = async (phone, password) => {
    try {
      const response = await authService.login(phone, password);

      if (response.success && response.user) { // Added check for user object
        // Construct userData based on login response
        const userData = {
          id: response.user.id,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          // Names are NOT returned by your login endpoint based on your backend code
          // Try to get from localStorage if available from previous registration
          name: phone, // Default fallback name
        };

        // Attempt to enrich with localStorage data (contains names if user registered)
        const savedUserString = localStorage.getItem('user');
        if (savedUserString) {
           try {
             const savedUserObject = JSON.parse(savedUserString);
             // Check if stored user matches and has names
             if (savedUserObject && (savedUserObject.id === response.user.id || savedUserObject.mobileNumber === phone) && savedUserObject.firstName) {
                userData.firstName = savedUserObject.firstName; // Add firstName if found
                userData.lastName = savedUserObject.lastName || ''; // Add lastName if found
                userData.name = `${userData.firstName} ${userData.lastName}`.trim(); // Update name
             }
           } catch (parseError) { console.warn("Login: Could not parse localStorage user", parseError); }
        }

        // Store token (authService likely does this) and the best user data we have
        // localStorage.setItem('authToken', response.token); // Handled by authService?
        localStorage.setItem('user', JSON.stringify(userData)); // Store merged/fallback data
        setUser(userData); // Update state

        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
       console.error("Login function error:", error);
       authService.logout(); // Ensure clean state on login failure
       setUser(null);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  // Logout function
  const logout = () => {
    authService.logout(); // Handles clearing localStorage
    setUser(null);        // Clears state
    console.log("User logged out");
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

  // --- / End of Existing Authentication Logic ---


  // --- ADDED: Placeholder functions for Account Page ---

  // Placeholder: Fetches order list FROM YOUR BACKEND via authService
  const fetchOrders = async () => {
    console.log("UserProvider: Attempting fetchOrders (placeholder)...");
    try {
      // **TODO: Implement authService.getOrders() to call YOUR backend (e.g., GET /api/user/orders)**
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
      const currentUserMobile = user?.mobileNumber || 'UNKNOWN';
      return [ // Return dummy data
         { orderNo: 'ORD123', appointmentDate: '2025-10-20 09:00', products: 'AAROGYAM FEMALE', rate: '2799', status: 'DONE', benMaster: [{ id: 'SP12345678', mobile: currentUserMobile, pincode: '123456' }], pincode: '123456' }, // Added pincode
         { orderNo: 'ORD456', appointmentDate: '2025-09-15 11:30', products: 'AAROGYAM 1.1', rate: '1799', status: 'REPORTED', benMaster: [{ id: 'SP98765432', mobile: currentUserMobile, pincode: '654321' }], pincode: '654321' }, // Added pincode
         { orderNo: 'ORD789', appointmentDate: '2025-10-23 14:00', products: 'FBS', rate: '149', status: 'ASSIGNED', benMaster: [{ id: 'SP55555555', mobile: currentUserMobile, pincode: '987654' }], pincode: '987654' }, // Added pincode
      ];
    } catch (error) {
      console.error("Fetch orders error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  };

  // Placeholder: Fetches report URL FROM YOUR BACKEND via authService
  const getReportDownloadLink = async (leadId, mobileNumber, reportFormat = 'PDF') => {
    console.log(`UserProvider: Attempting getReportDownloadLink for ${leadId} (placeholder)...`);
    try {
       // **TODO: Implement authService.getReportUrl() to call YOUR backend (e.g., POST /api/reports/download-url)**
       await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
       return `https://thyrocare-dummy-report.com/download?id=${leadId}&format=${reportFormat}&mobile=${mobileNumber}`;
    } catch (error) {
      console.error("Fetch report URL error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get report URL');
    }
  };

  // Placeholder: Updates Profile VIA YOUR BACKEND via authService
  const updateProfile = async (profileData) => { // Expects { firstName, lastName }
      console.log('UserProvider: Attempting updateProfile (placeholder)...', profileData);
      if (!user) throw new Error("Not logged in");
      try {
          // **TODO: Implement authService.updateMyProfile() to call YOUR backend (e.g., PATCH /api/user/profile)**
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
          const updatedUserData = { ...user, ...profileData, name: `${profileData.firstName} ${profileData.lastName || ''}`.trim() };
          setUser(updatedUserData); // Optimistic UI update
          localStorage.setItem('user', JSON.stringify(updatedUserData)); // Update storage
          console.log('Profile update simulated.');
          return { success: true, message: "Profile updated (simulated)", user: updatedUserData };
      } catch (error) {
          console.error("Update profile error:", error);
          throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
      }
  };

  // --- ADDED: Placeholder functions for Rescheduling ---
   // Placeholder: Fetches available appointment slots via YOUR BACKEND
  const fetchAppointmentSlots = async (pincode, date, benCount = 1) => {
    console.log(`UserProvider: Fetching slots for pincode ${pincode}, date ${date}, benCount ${benCount} (placeholder)...`);
    try {
      // **TODO: Implement authService.getAppointmentSlots(...) call to YOUR backend**
      await new Promise(resolve => setTimeout(resolve, 700));
      const hour = new Date().getHours();
      const dummySlots = [ /* ... dummy slots ... */ ];
      // ... dummy slot filtering logic ...
      return dummySlots; // Or filtered slots
    } catch (error) {
      console.error("Fetch slots error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch slots');
    }
  };

  // Placeholder: Reschedules order via YOUR BACKEND
  const rescheduleOrder = async (orderNo, newAppointmentDateTime, reason) => {
    console.log(`UserProvider: Rescheduling order ${orderNo} to ${newAppointmentDateTime} (placeholder)...`);
    try {
      // **TODO: Implement authService.rescheduleOrder(...) call to YOUR backend**
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Order ${orderNo} reschedule simulated successfully.`);
      return { success: true, message: `Order ${orderNo} rescheduled successfully (simulated)` };
    } catch (error) {
      console.error("Reschedule order error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reschedule order');
    }
  };

  // --- Context Value (with ALL additions) ---
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
    fetchOrders,          // Added previously
    getReportDownloadLink, // Added previously
    updateProfile,        // Added previously
    fetchAppointmentSlots, // Added now
    rescheduleOrder,     // Added now
  };

   if (loading) {
     return <div>Loading Application...</div>;
   }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};