import express from "express";
import User from "../../models/user.model.js";
import { createUser, loginUser, getMe } from "./user.controller.js";
import auth from "../middleware/auth.middleware.js";

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

export default router;
