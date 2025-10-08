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
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Page background: solid blue + your blue-line image from public/auth-bg.jpg */}
      <div className="absolute inset-0 -z-10 bg-[#0EA5E9]" />
      <div
        className="absolute inset-0 -z-10 bg-no-repeat bg-cover bg-center opacity-90"
        style={{ backgroundImage: "url('/auth-bg.jpg')" }}
        aria-hidden
      />
      {/* Top flight paths overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0">
        <svg viewBox="0 0 1440 160" className="w-full h-40 text-white/80" preserveAspectRatio="none">
          <path d="M0,100 C200,20 400,140 640,60 S1040,120 1440,40" stroke="currentColor" strokeWidth="3" strokeDasharray="10 10" fill="none" />
          <path d="M0,130 C240,60 520,140 820,80 S1200,140 1440,90" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" opacity="0.6" fill="none" />
          {/* plane icons */}
          <text x="620" y="58" fontSize="16" fill="white" opacity="0.95">✈</text>
          <text x="820" y="78" fontSize="14" fill="white" opacity="0.85">✈</text>
          <text x="1180" y="88" fontSize="14" fill="white" opacity="0.8">✈</text>
        </svg>
      </div>
  <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left: Form */}
        <div className="p-8 md:p-10">
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

        {/* Right: Illustration & tagline */}
  <div className="relative bg-[url('/auth-hero.jpg')] bg-cover bg-center min-h-[360px]">
          <div className="absolute inset-0 bg-cyan-600/30" />
          <div className="relative h-full flex items-end justify-center p-6">
            <div className="bg-white/95 rounded-xl shadow-lg p-5 max-w-xs">
              <h2 className="text-lg font-extrabold text-sky-600">Welcome back, Admin</h2>
              <p className="text-sm text-slate-600 mt-1">Keep operations running smoothly</p>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom skyline overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
        <svg viewBox="0 0 1440 140" className="w-full h-28 text-white/90" preserveAspectRatio="none">
          <rect x="20" y="60" width="30" height="80" fill="currentColor" opacity="0.9" />
          <rect x="70" y="40" width="24" height="100" fill="currentColor" opacity="0.85" />
          <polygon points="120,140 140,80 160,140" fill="currentColor" opacity="0.9" />
          <rect x="180" y="70" width="40" height="70" fill="currentColor" opacity="0.9" />
          <rect x="240" y="50" width="28" height="90" fill="currentColor" opacity="0.85" />
          <rect x="290" y="85" width="50" height="55" fill="currentColor" opacity="0.9" />
          <polygon points="360,140 380,65 400,140" fill="currentColor" opacity="0.92" />
          <rect x="420" y="60" width="32" height="80" fill="currentColor" opacity="0.9" />
          <rect x="460" y="35" width="26" height="105" fill="currentColor" opacity="0.85" />
          <rect x="500" y="75" width="44" height="65" fill="currentColor" opacity="0.9" />
          <rect x="560" y="55" width="22" height="85" fill="currentColor" opacity="0.9" />
          <rect x="600" y="78" width="34" height="62" fill="currentColor" opacity="0.9" />
          <polygon points="660,140 676,90 692,140" fill="currentColor" opacity="0.92" />
          <rect x="710" y="62" width="30" height="78" fill="currentColor" opacity="0.88" />
          <rect x="750" y="48" width="26" height="92" fill="currentColor" opacity="0.86" />
          <rect x="786" y="86" width="46" height="54" fill="currentColor" opacity="0.9" />
          <rect x="840" y="60" width="28" height="80" fill="currentColor" opacity="0.88" />
          <polygon points="890,140 910,82 930,140" fill="currentColor" opacity="0.92" />
          <rect x="950" y="58" width="32" height="82" fill="currentColor" opacity="0.9" />
          <rect x="990" y="40" width="24" height="100" fill="currentColor" opacity="0.85" />
          <rect x="1020" y="78" width="40" height="62" fill="currentColor" opacity="0.9" />
          <rect x="1070" y="66" width="22" height="74" fill="currentColor" opacity="0.88" />
          <rect x="1100" y="90" width="44" height="50" fill="currentColor" opacity="0.9" />
          <polygon points="1160,140 1180,70 1200,140" fill="currentColor" opacity="0.92" />
          <rect x="1220" y="60" width="28" height="80" fill="currentColor" opacity="0.9" />
          <rect x="1260" y="50" width="24" height="90" fill="currentColor" opacity="0.86" />
          <rect x="1290" y="85" width="50" height="55" fill="currentColor" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
};

export default AdminLogin;
