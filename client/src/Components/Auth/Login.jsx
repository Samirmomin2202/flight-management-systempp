import http from "../../api/http";
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { getToken } from "../redux/tokenSlice";
import { getUser } from "../redux/userSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useFlightStore from "../zustand store/ZStore";
import logo from "../../Assets/flight-logo.png";

const Login = () => {
  const { getIsLoggedIn } = useFlightStore();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const navigateTo = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const notify = (text, type = "info") => toast[type](text, { theme: "colored" });

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isPending) return; // Prevent multiple clicks
    setIsPending(true);

    try {
  const loginRes = await http.post("/user/login", loginData);
  // Using simplified backend that returns { success, data: { id, email, username } }
  const token = loginRes?.data?.token; // optional if you later add JWT issuing

      if (token) {
        Cookies.set("token", token);
        dispatch(getToken(token));
      }

      // Backend returns user data in login response
  const userData = loginRes?.data?.data;
      if (!userData) throw new Error("No user data received");
  // Persist user for Profile and page reloads
  try { localStorage.setItem("currentUser", JSON.stringify(userData)); } catch {}
  dispatch(getUser(userData));
      getIsLoggedIn(true);

  notify("Login successful!", "success");
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");
  navigateTo(redirect || "/");
    } catch (error) {
      console.error("Login failed:", error);
  const msg = error.response?.data?.message || "Login failed. Please check credentials.";
  notify(msg, "error");
    } finally {
      setIsPending(false);
    }
  };

  const inputIconCls = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";
  const inputBaseCls = "mt-1 w-full text-sm border rounded-lg py-2.5 pl-10 pr-16 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

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
        {/* Left: Illustration & testimonial */}
        <div className="relative hidden md:block">
          <div className="absolute inset-0 m-6 rounded-2xl overflow-hidden bg-blue-900">
            <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('/auth-hero.jpg')" }} />
            <div className="absolute inset-0 bg-blue-900/60" />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <p className="text-lg md:text-xl font-semibold max-w-md">We have been using FlightHub to book flights and can’t imagine working without it.</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={logo} alt="avatar" className="h-10 w-10 rounded-full bg-white/90 p-1" />
                <div>
                  <div className="text-sm font-semibold">Man Flynn</div>
                  <div className="text-xs text-white/80">Founder, Whitebus Agency</div>
                </div>
              </div>
              <div className="mt-3 text-amber-300">★★★★★</div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-8 md:p-10">
          <div className="mb-6">
            <div className="flex flex-col items-center gap-2">
              <img src={logo} alt="FlightHub" className="h-10 w-10" />
              <h1 className="text-xl font-extrabold text-slate-900">Welcome Back!</h1>
              <p className="text-xs text-slate-500">Please enter your credentials</p>
            </div>
          </div>

          <form className="w-full space-y-4" onSubmit={handleLogin}>
            <fieldset disabled={isPending} className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <span className={inputIconCls}>📧</span>
                  <input id="email" className={inputBaseCls} type="email" name="email" value={loginData.email} onChange={handleOnChange} placeholder="you@example.com" required />
                </div>
              </div>
              <div className="flex flex-col">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <span className={inputIconCls}>🔒</span>
                  <input id="password" className={inputBaseCls} type={showPassword ? "text" : "password"} name="password" value={loginData.password} onChange={handleOnChange} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute top-1/2 -translate-y-1/2 right-2 text-xs text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50">{showPassword ? "Hide" : "Show"}</button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="text-slate-700">Remember me</span>
                </label>
                <Link to="/forgot" className="text-blue-700 hover:underline">Forgot password?</Link>
              </div>
              <button type="submit" className={`w-full mt-1 py-2.5 rounded-lg shadow-lg transition-all duration-200 ${isPending ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:from-blue-600 hover:to-blue-800"}`} disabled={isPending}>{isPending ? "Logging in..." : "Login Now"}</button>
            </fieldset>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-700">Don’t have an account? </span>
            <Link to="/signup" className="font-semibold text-blue-700 hover:underline">Create an account</Link>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>

        {/* Right side (left on desktop) already used by illustration. */}
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

export default Login;
