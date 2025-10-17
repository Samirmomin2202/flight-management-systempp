import axios from "axios";

// Generic API client for all services (users, bookings, etc.)
// Use path-specific endpoints like /user/login, /user/signup, /flights, etc.
const http = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;
