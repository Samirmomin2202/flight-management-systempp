import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../../api/http";
import logo from "../../Assets/flight-logo.png";

const Signup = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState({ success: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailValid = useMemo(() => /.+@.+\..+/.test(user.email), [user.email]);
  const passMatch = useMemo(() => user.password && user.password === user.confirmPassword, [user.password, user.confirmPassword]);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatus({ success: "", error: "" });
    setLoading(true);

    try {
      const payload = { username: user.username, surname: user.surname, email: user.email, password: user.password };
      const res = await http.post("/user/signup", payload);

      console.log("Signup response:", res.data);

      // ✅ Only show success if backend returned success:true
      if ((res.status === 201 || res.status === 200) && res.data.success) {
        setStatus({
          success: "Signup successful! Redirecting to login...",
          error: ""
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatus({
          success: "",
          error: res.data.message || "Signup failed. Please try again."
        });
      }
    } catch (err) {
      console.error("Signup failed:", err);
      const errorMsg =
        err.response?.data?.message || "Signup failed. Please try again.";
      setStatus({ success: "", error: errorMsg });
    } finally {
      setLoading(false);
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
          <text x="640" y="62" fontSize="16" fill="white" opacity="0.95">✈</text>
          <text x="860" y="82" fontSize="14" fill="white" opacity="0.85">✈</text>
          <text x="1200" y="92" fontSize="14" fill="white" opacity="0.8">✈</text>
        </svg>
      </div>
  <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left: Illustration & testimonial */}
        <div className="relative hidden md:block">
          <div className="absolute inset-0 m-6 rounded-2xl overflow-hidden bg-blue-900">
            <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('/auth-hero.jpg')" }} />
            <div className="absolute inset-0 bg-blue-900/60" />
            <div className="relative h-full flex flex-col justify-end p-8 text-white">
              <p className="text-lg md:text-xl font-semibold max-w-md">Join thousands of travelers booking smarter with FlightHub.</p>
              <div className="mt-5 flex items-center gap-3">
                <img src={logo} alt="avatar" className="h-10 w-10 rounded-full bg-white/90 p-1" />
                <div>
                  <div className="text-sm font-semibold">A happy traveler</div>
                  <div className="text-xs text-white/80">5-star experience</div>
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
              <h1 className="text-xl font-extrabold text-slate-900">Create Account</h1>
              <p className="text-xs text-slate-500">Please fill in your details</p>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700" htmlFor="username">First Name</label>
                <input id="username" name="username" placeholder="John" onChange={handleOnChange} required className="mt-1 border p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700" htmlFor="surname">Surname</label>
                <input id="surname" name="surname" placeholder="Doe" onChange={handleOnChange} required className="mt-1 border p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" onChange={handleOnChange} required className="mt-1 border w-full p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" onChange={handleOnChange} required className="mt-1 border w-full p-2.5 pr-16 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute top-1/2 -translate-y-1/2 right-2 text-xs text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50">{showPassword ? "Hide" : "Show"}</button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Use 8+ characters including a number.</p>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Re-enter password" onChange={handleOnChange} required className={`mt-1 border w-full p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 ${user.confirmPassword && !passMatch ? 'border-rose-300 focus:ring-rose-400' : 'focus:ring-blue-500 focus:border-blue-500'}`} />
              {user.confirmPassword && !passMatch && <p className="text-xs text-rose-600 mt-1">Passwords do not match.</p>}
            </div>

            <div className="text-xs">
              <label className="inline-flex items-center">
                <input type="checkbox" required className="mr-2" /> I agree to the <Link to="#" className="text-blue-700 hover:underline ml-1">Disclaimer & Terms</Link>
              </label>
            </div>

            <button type="submit" disabled={loading || !emailValid || !passMatch} className={`w-full py-2.5 rounded-lg text-white shadow-lg transition duration-200 ${loading || !emailValid || !passMatch ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800"}`}>{loading ? "Signing up..." : "Create account"}</button>

            {status.error && (<p className="text-red-600 text-sm mt-2">{status.error}</p>)}
            {status.success && (<p className="text-green-600 text-sm mt-2">{status.success}</p>)}
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-700">Already have an account? </span>
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">Login</Link>
          </div>
        </div>

        {/* Right side illustration handled in the left column on desktop */}
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

export default Signup;
