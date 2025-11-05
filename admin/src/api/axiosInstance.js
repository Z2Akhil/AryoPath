import axios from "axios";
import authService from "../services/authService";

export const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach API key to every request
axiosInstance.interceptors.request.use((config) => {
  // Get current API key from auth service
  const apiKey = authService.getCurrentApiKey();
  
  console.log('Axios request interceptor:', {
    url: config.url,
    method: config.method,
    hasApiKey: !!apiKey,
    apiKey: apiKey ? apiKey.substring(0, 10) + '...' : null
  });
  
  if (apiKey) {
    // Add API key as x-api-key header
    config.headers['x-api-key'] = apiKey;
  }
  
  return config;
});

// Response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication-related errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear authentication data on auth errors
      authService.clearAuthData();
      
      // Redirect to login if we're not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
