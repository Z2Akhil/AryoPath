import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if there was a token and it expired
    if (error.response?.status === 401 && localStorage.getItem('authToken')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Request OTP for verification
  async requestOTP(mobileNumber, purpose = 'verification') {
    const response = await api.post('/auth/request-otp', {
      mobileNumber,
      purpose,
    });
    return response.data;
  },

  // Verify OTP
  async verifyOTP(mobileNumber, otp, purpose = 'verification') {
    const response = await api.post('/auth/verify-otp', {
      mobileNumber,
      otp,
      purpose,
    });
    return response.data;
  },

  // Register user
  async register(firstName, lastName, mobileNumber, password, otp) {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      mobileNumber,
      password,
      otp,
    });
    return response.data;
  },

  // Set password
  async setPassword(mobileNumber, password) {
    const response = await api.post('/auth/set-password', {
      mobileNumber,
      password,
    });
    return response.data;
  },

  // Login
  async login(mobileNumber, password) {
    const response = await api.post('/auth/login', {
      mobileNumber,
      password,
    });
    return response.data;
  },

  // Forgot password - request OTP
  async forgotPassword(mobileNumber) {
    const response = await api.post('/auth/forgot-password', {
      mobileNumber,
    });
    return response.data;
  },

  // Reset password with OTP
  async resetPassword(mobileNumber, otp, newPassword) {
    const response = await api.post('/auth/reset-password', {
      mobileNumber,
      otp,
      newPassword,
    });
    return response.data;
  },

  // Get user profile
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Logout (client-side only)
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export default authService;
