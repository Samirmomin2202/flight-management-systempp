import axios from "axios";
import { useAdminStore } from "../stores/adminStore";

// Admin-specific HTTP client that includes JWT token
const adminHttp = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
adminHttp.interceptors.request.use(
  (config) => {
    // Get token from store (works outside React components too)
    const token = useAdminStore.getState().adminToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401/403 errors
adminHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear admin session on unauthorized
      useAdminStore.getState().logout();
      // Optionally redirect to login
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default adminHttp;



