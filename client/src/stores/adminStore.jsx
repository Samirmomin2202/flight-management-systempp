import { create } from "zustand";

export const useAdminStore = create((set, get) => ({
  adminUser: null,

  // Now using email & password
  login: (email, password) => {
    // Example hardcoded admin account (replace with API call if needed)
    if (email === "admin123@gmail.com" && password === "admin123") {
      set({ adminUser: { email, role: "admin" } });
      return true;
    }
    return false;
  },

  logout: () => set({ adminUser: null }),
  isAuthenticated: () => !!get().adminUser,
}));
