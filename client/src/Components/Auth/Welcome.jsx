import React from "react";
import { useSelector } from "react-redux";
import { user as selectUser } from "../redux/userSlice";
import { Link } from "react-router-dom";

const Welcome = () => {
  const currentUser = useSelector(selectUser);
  const displayName = currentUser?.username || currentUser?.name || currentUser?.email || "User";

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center bg-white rounded-2xl shadow-xl border border-blue-100 p-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900">
          Welcome, <span className="text-amber-500">Flight Hub {displayName}</span>
        </h1>
        <p className="mt-3 text-blue-700">You have successfully logged in.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/" className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition">Go to Home</Link>
          <Link to="/profile" className="px-5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold transition">View Profile</Link>
        </div>
      </div>
    </div>
  );
};

export default Welcome;


