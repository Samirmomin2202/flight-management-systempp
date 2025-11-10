import { create } from "zustand";
import http from "../api/http";

const persisted = (() => {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const persistedToken = (() => {
  try {
    return localStorage.getItem("adminToken") || null;
  } catch {
    return null;
  }
})();

export const useAdminStore = create((set, get) => ({
  adminUser: persisted,
  adminToken: persistedToken,

  // Login using backend API
  login: async (email, password) => {
    try {
      const response = await http.post("/user/login", { email, password });
      
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        const token = response.data.token;
        
        // Check if user has admin role
        if (userData.role !== "admin") {
          return { success: false, message: "Access denied. Admin privileges required." };
        }
        
        const user = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role || "admin",
        };
        
        set({ adminUser: user, adminToken: token });
        try {
          localStorage.setItem("adminUser", JSON.stringify(user));
          localStorage.setItem("adminToken", token);
        } catch {}
        
        return { success: true, user };
      } else {
        return { success: false, message: response.data.message || "Login failed" };
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Login failed";
      return { success: false, message };
    }
  },

  logout: () => {
    try {
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminToken");
    } catch {}
    set({ adminUser: null, adminToken: null });
  },
  
  updateAdmin: (partial) => {
    const current = get().adminUser || {};
    const updated = { ...current, ...partial };
    set({ adminUser: updated });
    try { localStorage.setItem("adminUser", JSON.stringify(updated)); } catch {}
  },
  
  setAdminSession: (user, token) => {
    set({ adminUser: user, adminToken: token });
    try {
      localStorage.setItem("adminUser", JSON.stringify(user));
      localStorage.setItem("adminToken", token);
    } catch {}
  },
  
  isAuthenticated: () => {
    const user = get().adminUser;
    const token = get().adminToken;
    return !!(user && token && user.role === "admin");
  },
  
  getToken: () => get().adminToken,
}));
