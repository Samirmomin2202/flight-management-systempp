import express from "express";
import User from "../../models/user.model.js";
import { createUser, loginUser, getMe } from "./user.controller.js";
import Joi from "joi";
import auth from "../middleware/auth.middleware.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../../utils/mailer.js";

const router = express.Router();

// Signup
router.post("/signup", createUser);

// Login
router.post("/login", loginUser);

// Admin: list all users (no auth yet; wire middleware later if needed)
router.get("/all", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Current user (protected)
router.get("/me", auth, getMe);

// Update current user profile (protected)
router.put("/me", auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const schema = Joi.object({
      username: Joi.string().optional(),
      surname: Joi.string().optional(),
      // Accept full data URL for images: data:image/<type>;base64,<payload>
      avatarBase64: Joi.string()
        .pattern(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/)
        .allow("", null)
        .optional(),
    });
    const { error, value } = schema.validate(req.body, { allowUnknown: false });
    if (error) return res.status(400).json({ success: false, message: error.message });

    // Limit avatar size roughly by string length (~1.33x bytes of base64). Here cap at ~2MB image -> ~2.7MB base64
    if (value.avatarBase64 && value.avatarBase64.length > 2_800_000) {
      return res.status(400).json({ success: false, message: "Avatar too large. Max ~2 MB." });
    }

    const updated = await User.findByIdAndUpdate(req.user._id, value, { new: true }).select("-password");
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
});

export default router;
// Forgot password: request OTP
router.post("/forgot/request", async (req, res) => {
  const schema = Joi.object({ email: Joi.string().email().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(200).json({ success: true, message: "If the email exists, an OTP has been sent." });

    // Generate 6-digit OTP and hash it
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetOtpHash = hash;
    user.resetOtpExpiresAt = expires;
    user.resetOtpAttempts = 0;
    await user.save();

    // Send email (non-blocking behavior is okay; we await here for error reporting)
    await sendEmail({
      to: user.email,
      subject: "Your password reset OTP",
      text: `Use this OTP to reset your password: ${otp}. This code is valid for 10 minutes.`,
    });

    res.json({ success: true, message: "OTP sent if email is registered." });
  } catch (err) {
    console.error("Forgot request error:", err);
    res.status(500).json({ success: false, message: "Unable to send OTP right now." });
  }
});

// Forgot password: verify OTP and set new password
router.post("/forgot/verify", async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const user = await User.findOne({ email: value.email });
    if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

    if (user.resetOtpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }
    if (user.resetOtpAttempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many attempts. Request a new OTP." });
    }

    const match = await bcrypt.compare(value.otp, user.resetOtpHash);
    user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
    if (!match) {
      await user.save();
      return res.status(400).json({ success: false, message: "Incorrect OTP." });
    }

    // Set new password
    const hashed = await bcrypt.hash(value.newPassword, 10);
    user.password = hashed;
    user.resetOtpHash = undefined;
    user.resetOtpExpiresAt = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Forgot verify error:", err);
    res.status(500).json({ success: false, message: "Unable to reset password." });
  }
});
