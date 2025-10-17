import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import logo from "../../Assets/flight-logo.png";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0); // seconds
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef([]);

  const combinedOtp = useMemo(() => otpInputs.join("").slice(0, 6), [otpInputs]);
  const emailValid = useMemo(() => /.+@.+\..+/.test(email), [email]);
  const passwordHintOk = useMemo(() => newPassword.length >= 8 && /\d/.test(newPassword), [newPassword]);

  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

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
        // start resend timer (60s)
        setResendTimer(60);
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
      const res = await axios.post("http://localhost:5000/api/user/forgot/verify", { email, otp: combinedOtp, newPassword });
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

  // resend timer tick
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    // accept only digits
    const v = value.replace(/\D/g, "").slice(0, 1);
    setOtpInputs((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpInputs[index] && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowLeft" && otpRefs.current[index - 1]) {
      e.preventDefault();
      otpRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && otpRefs.current[index + 1]) {
      e.preventDefault();
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const arr = text.split("");
    setOtpInputs([arr[0] || "", arr[1] || "", arr[2] || "", arr[3] || "", arr[4] || "", arr[5] || ""]);
    if (otpRefs.current[Math.min(text.length, 5)]) {
      otpRefs.current[Math.min(text.length, 5)].focus();
    }
    e.preventDefault();
  };

  const resendOtp = async () => {
    if (resendTimer > 0 || !emailValid) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/user/forgot/request", { email });
      if (res.data.success) {
        setMessage("OTP resent to your email.");
        setResendTimer(60);
      } else {
        setError(res.data.message || "Unable to resend OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <img src={logo} alt="FlightHub" className="w-8 h-8 object-contain" />
          <h1 className="text-2xl font-extrabold text-slate-900">Forgot Password</h1>
        </div>
        {message && <div role="status" aria-live="polite" className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">{message}</div>}
        {error && <div role="alert" className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">{error}</div>}

        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${email && !emailValid ? 'border-rose-300 focus:ring-rose-400' : 'focus:ring-sky-500'}`}
                placeholder="you@example.com"
                required
              />
              {email && !emailValid && <p className="text-xs text-rose-600 mt-1">Enter a valid email address.</p>}
            </div>
            <button type="submit" disabled={loading || !emailValid} className={`w-full rounded-lg px-4 py-2 text-white shadow ${loading || !emailValid ? 'bg-slate-300 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}>{loading ? "Sending..." : "Send OTP"}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1 text-slate-700">Enter OTP</label>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-sky-700 hover:underline">Change email</button>
              </div>
              <div className="flex items-center gap-2" onPaste={handleOtpPaste}>
                {otpInputs.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-10 h-12 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className={`text-xs ${combinedOtp.length === 6 ? 'text-emerald-600' : 'text-slate-500'}`}>{combinedOtp.length === 6 ? 'OTP looks good' : 'Enter the 6-digit code'}</p>
                <button type="button" onClick={resendOtp} disabled={resendTimer > 0 || loading || !emailValid} className={`text-xs ${resendTimer > 0 || loading || !emailValid ? 'text-slate-400' : 'text-sky-700 hover:underline'}`}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-700">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-2 my-auto text-slate-500 hover:text-slate-700 text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className={`text-xs mt-1 ${passwordHintOk ? 'text-emerald-600' : 'text-slate-500'}`}>Use 8+ characters including a number.</p>
            </div>
            <button
              type="submit"
              disabled={loading || combinedOtp.length !== 6 || newPassword.length < 6}
              className={`w-full rounded-lg px-4 py-2 text-white shadow ${loading || combinedOtp.length !== 6 || newPassword.length < 6 ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">Your password has been reset. You can now log in with your new password.</p>
            <a href="/login" className="inline-block rounded-lg px-4 py-2 text-white shadow bg-sky-600 hover:bg-sky-700">Go to Login</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
