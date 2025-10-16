import express from "express";
import User from "../../models/user.model.js";
import { createUser, loginUser, getMe } from "./user.controller.js";
import Joi from "joi";
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
