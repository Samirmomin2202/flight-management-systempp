import Joi from "joi";
import bcrypt from "bcryptjs";
import User from "../../models/user.model.js";
import { generateTokenFromPayload } from "../utils/helper.utils.js";

// Create User
export const createUser = async (req, res) => {
  const { username, surname, email, password } = req.body;

  const schema = Joi.object({
    username: Joi.string().required(),
    surname: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate({ username, surname, email, password });
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      surname,
      email,
      password: hashedPassword,
    });

    newUser.password = undefined;
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate({ email, password });
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Issue JWT so client can call /api/user/me and protected routes
    const token = generateTokenFromPayload(user._id.toString());

    res.status(200).json({
      success: true,
      data: { id: user._id, email: user.email, username: user.username },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

// (Optional) Get current user – only if you implement auth middleware
export const getUser = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

// Return current authenticated user using auth middleware (req.user)
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    res.status(200).json({ success: true, data: req.user });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};
