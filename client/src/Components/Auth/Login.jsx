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
import { useAdminStore } from "../../stores/adminStore";
import logo from "../../Assets/flight-logo.png";
import fly from "../../Assets/fly.jpeg";

const Login = () => {
  const { getIsLoggedIn } = useFlightStore();
  const adminLogin = useAdminStore((state) => state.login);
  const setAdminSession = useAdminStore((state) => state.setAdminSession);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [postLoginPending, setPostLoginPending] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
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
      // Check if password is exactly "admin" - route to admin login
      if (loginData.password === "admin") {
        console.log("🔐 Admin login attempt detected");
        // Call backend login API - backend will fetch admin user from MongoDB
        try {
          const loginRes = await http.post("/user/login", loginData);
          console.log("📡 Backend response:", loginRes.data);
          
          if (loginRes.data.success && loginRes.data.data) {
            const adminData = loginRes.data.data;
            const adminToken = loginRes.data.token;
            
            console.log("👤 Admin data received:", adminData);
            console.log("🔑 Admin token received:", adminToken ? "Yes" : "No");
            
            // Verify that the returned user has admin role
            if (adminData.role === "admin") {
              // Set admin session using adminStore with data from MongoDB
              const adminUser = {
                id: adminData.id,
                email: adminData.email,
                username: adminData.username,
                surname: adminData.surname,
                role: adminData.role || "admin",
              };
              
              console.log("💾 Setting admin session:", adminUser);
              setAdminSession(adminUser, adminToken);
              
              // Verify session was set
              const verifySession = useAdminStore.getState();
              console.log("✅ Session verification:", {
                adminUser: verifySession.adminUser,
                adminToken: verifySession.adminToken ? "Set" : "Missing",
                isAuthenticated: verifySession.isAuthenticated()
              });
              
              notify("Admin login successful!", "success");
              setTimeout(() => {
                navigateTo("/admin/dashboard");
              }, 500);
              return;
            } else {
              console.error("❌ User role is not admin:", adminData.role);
              notify("Access denied. Admin privileges required.", "error");
              return;
            }
          } else {
            const msg = loginRes.data?.message || "Admin login failed. Please ensure an admin user exists in the database.";
            console.error("❌ Login failed:", msg);
            notify(msg, "error");
            return;
          }
        } catch (error) {
          console.error("❌ Admin login error:", error);
          console.error("❌ Error response:", error.response?.data);
          const msg = error.response?.data?.message || error.message || "Admin login failed. Please check console for details.";
          notify(msg, "error");
          return;
        }
      }

      // Normal user login flow
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
      // Navigate immediately to Home with a state flag to show overlay there
      const displayName = userData?.username || userData?.name || userData?.email || "";
      navigateTo("/", { state: { showWelcomeOverlay: true, welcomeName: displayName } });
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left: Card effect image */}
        <div className="hidden md:block relative">
          <img src={fly} alt="Flight" className="object-cover w-full h-full" style={{ minHeight: 400 }} />
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
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Username / Email</label>
                <div className="relative">
                  <span className={inputIconCls}>👤</span>
                  <input id="email" className={inputBaseCls} type="text" name="email" value={loginData.email} onChange={handleOnChange} placeholder="Enter username or email" required />
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
      {/* Post-login full-screen blur overlay */}
      {postLoginPending && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-blue-100 p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
            <h2 className="text-xl font-extrabold text-blue-900">Welcome{welcomeName ? ", Flight Hub " + welcomeName : ""}</h2>
            <p className="mt-1 text-slate-700">Preparing your experience...</p>
            <p className="mt-2 text-xs text-slate-500">Redirecting to home in a moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
