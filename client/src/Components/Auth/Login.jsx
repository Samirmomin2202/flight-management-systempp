import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { getToken } from "../redux/tokenSlice";
import { getUser } from "../redux/userSlice";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useFlightStore from "../zustand store/ZStore";

const Login = () => {
  const { getIsLoggedIn } = useFlightStore();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isPending, setIsPending] = useState(false);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const notify = (text, type = "info") => toast[type](text);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isPending) return; // Prevent multiple clicks
    setIsPending(true);

    try {
  const loginRes = await axios.post("http://localhost:5000/api/user/login", loginData);
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
      navigateTo("/");
    } catch (error) {
      console.error("Login failed:", error);
  const msg = error.response?.data?.message || "Login failed. Please check credentials.";
  notify(msg, "error");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: "url('/login.jpg')" }}
    >
      <div className="h-full w-full flex flex-col items-center md:h-full md:justify-center md:items-center bg-transparent">
        <div className="h-[100%] md:h-fit flex flex-col items-center bg-white bg-opacity-90 w-full md:w-[28%] px-8 pt-10 pb-5 rounded-md shadow-lg">
          <h3 className="font-medium text-lg">Welcome back!</h3>
          <p className="text-[10px] text-slate-500">Login your account to continue</p>

          <form className="w-full" onSubmit={handleLogin}>
            <fieldset disabled={isPending}>
              <div className="flex flex-col mt-2">
                <label htmlFor="email" className="text-sm text-slate-400">Email</label>
                <input
                  className="text-sm border rounded-lg shadow-lg py-2 px-1"
                  type="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleOnChange}
                  required
                />
              </div>

              <div className="flex flex-col mt-2">
                <label htmlFor="password" className="text-sm text-slate-400">Password</label>
                <input
                  className="text-sm border rounded-lg shadow-lg py-2 px-1"
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleOnChange}
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full mt-3 py-2 rounded-md shadow-lg transition-all duration-200 ${
                  isPending ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-950 text-white hover:bg-blue-900"
                }`}
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </button>
            </fieldset>
          </form>

          <p className="text-sm mt-3 text-slate-600 font-medium">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600">Sign Up</Link>
          </p>

          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </div>
    </div>
  );
};

export default Login;
