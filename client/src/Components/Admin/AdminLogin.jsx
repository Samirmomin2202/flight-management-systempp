import fly from "../../Assets/fly.jpeg";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminStore } from "../../stores/adminStore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAdminStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      toast.success("✅ Login successful!");
      setTimeout(() => navigate("/admin/dashboard"), 800);
    } else {
      toast.error("❌ Invalid email or password!");
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left: Card effect image for admin only */}
        <div className="hidden md:block relative">
          <img src={fly} alt="Flight" className="object-cover w-full h-full" style={{ minHeight: 400 }} />
        </div>
        {/* Right: Admin login form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold">✈</span>
              <h1 className="text-xl font-extrabold text-slate-900">Admin • Flight Hub</h1>
            </div>
            <p className="mt-2 text-slate-600">Sign in to manage flights, bookings and users</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700" />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-800 transition">
              Login
            </button>
          </form>
          <ToastContainer position="top-right" autoClose={2000} />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
