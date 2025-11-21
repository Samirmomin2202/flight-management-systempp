import axios from "axios";
import { API_BASE } from "./base.js";

const api = axios.create({
  baseURL: `${API_BASE}/api/flights`, // must match backend route
});

export default api;
