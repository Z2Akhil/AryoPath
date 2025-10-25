import axios from "axios";

const API_KEY = import.meta.env.VITE_API_KEY; // replace with your API key

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach API key to every request
axiosInstance.interceptors.request.use((config) => {
  if (!config.data) config.data = {};
  config.data.ApiKey = API_KEY;
  return config;
});
