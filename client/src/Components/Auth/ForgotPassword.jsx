import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/user/forgot/request", { email });
      if (res.data.success) {
        setMessage("We've sent an OTP to your email if it's registered.");
        setStep(2);
      } else {
        setError(res.data.message || "Unable to send OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/user/forgot/verify", { email, otp, newPassword });
      if (res.data.success) {
        setMessage("Password reset successful. You can now log in.");
        setStep(3);
      } else {
        setError(res.data.message || "Reset failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">Forgot Password</h1>
        {message && <div className="mb-3 p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{message}</div>}
        {error && <div className="mb-3 p-2 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2">{loading ? "Sending..." : "Send OTP"}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="6-digit code" maxLength={6} required />
            </div>
            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded px-4 py-2">{loading ? "Saving..." : "Reset Password"}</button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Your password has been reset. You can now log in with your new password.</p>
            <a href="/login" className="inline-block bg-blue-700 hover:bg-blue-800 text-white rounded px-4 py-2">Go to Login</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
