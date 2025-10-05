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
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/signup.jpg')" }}
    >
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h3 className="text-lg font-medium mb-2 text-center">Create an Account</h3>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <input
              name="username"
              placeholder="First Name"
              onChange={handleOnChange}
              required
              className="border p-2 rounded"
            />
            <input
              name="surname"
              placeholder="Surname"
              onChange={handleOnChange}
              required
              className="border p-2 rounded"
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleOnChange}
            required
            className="border w-full p-2 rounded"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleOnChange}
            required
            className="border w-full p-2 rounded"
          />

          <div className="text-xs">
            <input type="checkbox" required className="mr-1" />
            I agree to the{" "}
            <Link to="#" className="text-blue-600">
              Disclaimer & Terms
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading
                ? "bg-gray-400"
                : "bg-[#0F172A] hover:bg-[#1E293B] transition duration-200"
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          {status.error && (
            <p className="text-red-600 text-sm mt-2">{status.error}</p>
          )}
          {status.success && (
            <p className="text-green-600 text-sm mt-2">{status.success}</p>
          )}
        </form>

        <div className="flex items-center my-4">
          <hr className="flex-grow" />
          <span className="mx-2 text-sm">OR</span>
          <hr className="flex-grow" />
        </div>

        <button className="border w-full py-2 rounded mb-4 flex items-center justify-center gap-2 hover:bg-gray-100 transition duration-200">
          <i className="fab fa-google text-red-600"></i>
          <span>Sign up with Google</span>
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
