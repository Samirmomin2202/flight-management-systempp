import axios from "axios";
import { API_BASE } from "./base.js";

// Generic API client for all services (users, bookings, etc.)
// Use path-specific endpoints like /user/login, /user/signup, /flights, etc.
const http = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;
