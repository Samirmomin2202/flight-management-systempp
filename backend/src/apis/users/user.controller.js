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
      role: "user", // Default role for new users
    });

    newUser.password = undefined;
    res.status(201).json({ 
      success: true, 
      data: {
        ...newUser.toObject(),
        role: newUser.role || "user"
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string().required(), // Changed to allow username or email
    password: Joi.string().required(),
  });

  const { error } = schema.validate({ email, password });
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    // Special case: If password is exactly "admin", fetch admin user from MongoDB
    if (password === "admin") {
      console.log("🔐 Admin login attempt - email/username:", email);
      
      // Try to find admin user by email first, or find any admin user
      let adminUser = null;
      
      // Check if email looks like an email address
      const isEmail = email.includes("@");
      console.log("📧 Is email format:", isEmail);
      
      if (isEmail) {
        adminUser = await User.findOne({ email, role: "admin" });
        console.log("🔍 Admin search by email result:", adminUser ? "Found" : "Not found");
      } else {
        // If it's a username, try to find by username with admin role
        adminUser = await User.findOne({ username: email, role: "admin" });
        console.log("🔍 Admin search by username result:", adminUser ? "Found" : "Not found");
      }
      
      // If no admin found by email/username, find the first admin user
      if (!adminUser) {
        console.log("🔍 Searching for any admin user...");
        adminUser = await User.findOne({ role: "admin" });
        console.log("🔍 First admin user found:", adminUser ? "Yes" : "No");
      }
      
      if (!adminUser) {
        console.error("❌ No admin user found in database");
        // Check if there are any users at all
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: "admin" });
        console.log("📊 Database stats - Total users:", totalUsers, "Admin users:", adminCount);
        
        return res.status(400).json({ 
          success: false, 
          message: "No admin user found in database. Please create an admin user first using: node backend/scripts/create-admin.js <email> <password> [username] [surname]" 
        });
      }

      console.log("✅ Admin user found:", {
        id: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
        role: adminUser.role
      });

      // Issue JWT for admin
      const token = generateTokenFromPayload(adminUser._id.toString());
      console.log("🔑 JWT token generated:", token ? "Yes" : "No");

      res.status(200).json({
        success: true,
        data: { 
          id: adminUser._id, 
          email: adminUser.email, 
          username: adminUser.username,
          surname: adminUser.surname,
          role: adminUser.role || "admin"
        },
        token,
      });
      return;
    }

    // Normal user login flow
    // Try to find by email first
    let user = await User.findOne({ email });
    
    // If not found by email, try by username
    if (!user) {
      user = await User.findOne({ username: email });
    }
    
    if (!user)
      return res.status(400).json({ success: false, message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ success: false, message: "Invalid credentials" });

    // Issue JWT so client can call /api/user/me and protected routes
    const token = generateTokenFromPayload(user._id.toString());

    res.status(200).json({
      success: true,
      data: { 
        id: user._id, 
        email: user.email, 
        username: user.username,
        surname: user.surname,
        role: user.role || "user"
      },
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
