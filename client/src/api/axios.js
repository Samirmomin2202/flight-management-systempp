import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api/flights", // must match backend route
});

export default api;
