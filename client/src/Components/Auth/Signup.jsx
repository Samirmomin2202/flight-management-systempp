import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    surname: "",
    email: "",
    password: ""
  });

  const [status, setStatus] = useState({ success: "", error: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setStatus({ success: "", error: "" });
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/signup",
        user,
        { headers: { "Content-Type": "application/json" } }
      );

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-lg mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
            <p className="text-sm text-slate-600">Join to book and manage your flights easily</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700" htmlFor="username">First Name</label>
                <input
                  id="username"
                  name="username"
                  placeholder="John"
                  onChange={handleOnChange}
                  required
                  className="mt-1 border p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700" htmlFor="surname">Surname</label>
                <input
                  id="surname"
                  name="surname"
                  placeholder="Doe"
                  onChange={handleOnChange}
                  required
                  className="mt-1 border p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                onChange={handleOnChange}
                required
                className="mt-1 border w-full p-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  onChange={handleOnChange}
                  required
                  className="mt-1 border w-full p-2.5 pr-16 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 -translate-y-1/2 right-2 text-xs text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="text-xs">
              <label className="inline-flex items-center">
                <input type="checkbox" required className="mr-2" />
                I agree to the <Link to="#" className="text-blue-700 hover:underline ml-1">Disclaimer & Terms</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white shadow-lg transition duration-200 ${
                loading
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800"
              }`}
            >
              {loading ? "Signing up..." : "Create account"}
            </button>

            {status.error && (
              <p className="text-red-600 text-sm mt-2">{status.error}</p>
            )}
            {status.success && (
              <p className="text-green-600 text-sm mt-2">{status.success}</p>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-700">Already have an account? </span>
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
