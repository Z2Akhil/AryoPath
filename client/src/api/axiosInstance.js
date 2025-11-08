import axios from "axios";

const isProduction = import.meta.env.MODE === "production";

// Decide which base URL to use
const baseURL = isProduction
  ? import.meta.env.VITE_TARGET_URL   // Production backend (from Vercel env)
  : "http://localhost:3000/api";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
