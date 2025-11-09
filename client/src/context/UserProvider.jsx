import { useState, useEffect } from 'react';
import { UserContext } from './userContext';
import authService from '../services/authService';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Simply restore user from localStorage without API call
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Failed to restore user from localStorage:", error);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (name, phone, password, otp) => {
    try {
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || ''; 

      const response = await authService.register(firstName, lastName, phone, password, otp);

      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName || ''}`.trim(),
        };

        // Save auth token to localStorage
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }

        localStorage.setItem('user', JSON.stringify(userData)); 
        setUser(userData); 
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Register function error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await authService.login(phone, password);

      if (response.success && response.user) { 
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName || ''}`.trim() || phone,
        };

        // Save auth token to localStorage
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }

        localStorage.setItem('user', JSON.stringify(userData)); 
        setUser(userData); 

        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
       console.error("Login function error:", error);
       authService.logout();
       setUser(null);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const logout = () => {
    authService.logout(); 
    setUser(null); 
    console.log("User logged out");
  };

  const requestOTP = async (mobileNumber, purpose = 'verification') => {
    try {
      const response = await authService.requestOTP(mobileNumber, purpose);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (mobileNumber, otp, purpose = 'verification') => {
    try {
      const response = await authService.verifyOTP(mobileNumber, otp, purpose);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'OTP verification failed');
    }
  };

  const forgotPassword = async (mobileNumber) => {
    try {
      const response = await authService.forgotPassword(mobileNumber);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  const resetPassword = async (mobileNumber, otp, newPassword) => {
    try {
      const response = await authService.resetPassword(mobileNumber, otp, newPassword);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Password reset failed');
    }
  };
  const fetchOrders = async () => {
    console.log("UserProvider: Attempting fetchOrders (placeholder)...");
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const currentUserMobile = user?.mobileNumber || 'UNKNOWN';
      return [ 
         { orderNo: 'ORD123', appointmentDate: '2025-10-20 09:00', products: 'AAROGYAM FEMALE', rate: '2799', status: 'DONE', benMaster: [{ id: 'SP12345678', mobile: currentUserMobile, pincode: '123456' }], pincode: '123456' }, // Added pincode
         { orderNo: 'ORD456', appointmentDate: '2025-09-15 11:30', products: 'AAROGYAM 1.1', rate: '1799', status: 'REPORTED', benMaster: [{ id: 'SP98765432', mobile: currentUserMobile, pincode: '654321' }], pincode: '654321' }, // Added pincode
         { orderNo: 'ORD789', appointmentDate: '2025-10-23 14:00', products: 'FBS', rate: '149', status: 'ASSIGNED', benMaster: [{ id: 'SP55555555', mobile: currentUserMobile, pincode: '987654' }], pincode: '987654' }, // Added pincode
      ];
    } catch (error) {
      console.error("Fetch orders error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch orders');
    }
  };

  const getReportDownloadLink = async (leadId, mobileNumber, reportFormat = 'PDF') => {
    console.log(`UserProvider: Attempting getReportDownloadLink for ${leadId} (placeholder)...`);
    try {
       await new Promise(resolve => setTimeout(resolve, 600)); // Simulate delay
       return `https://thyrocare-dummy-report.com/download?id=${leadId}&format=${reportFormat}&mobile=${mobileNumber}`;
    } catch (error) {
      console.error("Fetch report URL error:", error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get report URL');
    }
  };

  const updateProfile = async (profileData) => { 
      console.log('UserProvider: Attempting updateProfile...', profileData);
      console.log('UserProvider: Current user:', user);
      
      // Debug: Check auth token
      const token = localStorage.getItem('authToken');
      console.log('UserProvider: Auth token exists:', !!token);
      if (token) {
          console.log('UserProvider: Auth token length:', token.length);
          console.log('UserProvider: Auth token first 20 chars:', token.substring(0, 20) + '...');
      }
      
      if (!user) throw new Error("Not logged in");
      try {
          console.log('UserProvider: Calling authService.updateProfile...');
          const response = await authService.updateProfile(profileData);
          console.log('UserProvider: Backend response:', response);
          
          if (response.success && response.user) {
              const updatedUserData = {
                  ...user,
                  ...response.user,
                  name: `${response.user.firstName} ${response.user.lastName || ''}`.trim()
              };
              setUser(updatedUserData);
              localStorage.setItem('user', JSON.stringify(updatedUserData));
              console.log('Profile updated successfully.');
              return { success: true, message: "Profile updated successfully", user: updatedUserData };
          } else {
              throw new Error(response.message || 'Failed to update profile');
          }
      } catch (error) {
          console.error("Update profile error:", error);
          console.error("Update profile error details:", {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
              config: {
                  url: error.config?.url,
                  method: error.config?.method,
                  headers: error.config?.headers
              }
          });
          throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
      }
  };

  // Check if user has complete contact information
  const hasCompleteContactInfo = () => {
    if (!user) return false;
    
    const requiredFields = [
      user.firstName,
      user.lastName,
      user.email,
      user.address,
      user.city,
      user.state
    ];
    
    return requiredFields.every(field => field && field.trim().length > 0);
  };

  const fetchAppointmentSlots = async (pincode, date, benCount = 1) => {
    console.log(`UserProvider: Fetching slots for pincode ${pincode}, date ${date}, benCount ${benCount} (placeholder)...`);
    try {
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
    fetchOrders,  
    getReportDownloadLink,
    updateProfile, 
    fetchAppointmentSlots,
    rescheduleOrder,
    hasCompleteContactInfo,
  };

   if (loading) {
     return <div>Loading Application...</div>;
   }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
