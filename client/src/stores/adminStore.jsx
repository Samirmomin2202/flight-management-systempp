import { create } from "zustand";

const persisted = (() => {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const useAdminStore = create((set, get) => ({
  adminUser: persisted,

  // Now using email & password
  login: (email, password) => {
    // Example hardcoded admin account (replace with API call if needed)
    if (email === "admin123@gmail.com" && password === "admin123") {
      const user = { email, role: "admin" };
      set({ adminUser: user });
      try { localStorage.setItem("adminUser", JSON.stringify(user)); } catch {}
      return true;
    }
    return false;
  },

  logout: () => {
    try { localStorage.removeItem("adminUser"); } catch {}
    set({ adminUser: null });
  },
  isAuthenticated: () => !!get().adminUser,
}));
