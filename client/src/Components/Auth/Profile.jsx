import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react"; // ✅ Logout icon

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/signup", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data?.data))
      .catch((err) => {
        console.error("Failed to fetch profile", err);
        Cookies.remove("token");
        navigate("/signup", { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    Cookies.remove("token");
    setUser(null);
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
        <p className="text-lg font-semibold text-slate-700 animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-6">
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl border border-slate-100">
        {/* Left Side Image */}
        <div className="md:w-1/2 bg-gradient-to-br from-indigo-100 to-blue-100 flex flex-col items-center justify-center p-8">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="User avatar"
            className="rounded-full w-44 h-44 border-4 border-white shadow-xl transition hover:scale-105"
          />
          <h3 className="mt-4 text-xl font-bold text-slate-700">{user.username}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>

        {/* Right Side Content */}
        <div className="md:w-1/2 p-10 flex flex-col justify-between bg-white">
          <div>
            <h2 className="text-3xl font-extrabold mb-6 text-indigo-800 tracking-tight">
              Profile Overview
            </h2>
            <div className="space-y-4 text-slate-700 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="font-semibold text-indigo-700">Username:</strong>{" "}
                {user.username}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="font-semibold text-indigo-700">Email:</strong>{" "}
                {user.email}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="font-semibold text-indigo-700">User ID:</strong>{" "}
                {user._id}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="font-semibold text-indigo-700">Role:</strong>{" "}
                {user.role || "user"}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="mt-10 w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
