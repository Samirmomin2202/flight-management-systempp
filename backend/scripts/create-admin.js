/**
 * Script to create an admin user in the database
 * 
 * Usage: node scripts/create-admin.js <email> <password> [username] [surname]
 * 
 * Example: node scripts/create-admin.js admin@example.com admin123 Admin User
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import User model
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: node create-admin.js <email> <password> [username] [surname]");
    console.error("Example: node create-admin.js admin@example.com admin123 Admin User");
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const username = args[2] || "Admin";
  const surname = args[3] || "User";

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/flight-management";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Update existing user to admin
      existingUser.role = "admin";
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.password = hashedPassword;
      existingUser.username = username;
      existingUser.surname = surname;
      await existingUser.save();
      console.log(`✅ Updated existing user to admin: ${email}`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = await User.create({
        email,
        password: hashedPassword,
        username,
        surname,
        role: "admin",
      });
      console.log(`✅ Created admin user: ${email}`);
      console.log(`   Username: ${username} ${surname}`);
      console.log(`   Role: ${adminUser.role}`);
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();



