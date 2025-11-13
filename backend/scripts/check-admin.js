/**
 * Script to check if admin users exist in the database
 * 
 * Usage: node scripts/check-admin.js
 */

import mongoose from "mongoose";
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

async function checkAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/flight-management";
    console.log("🔌 Connecting to MongoDB:", mongoUri.replace(/\/\/.*@/, "//***:***@"));
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    // Count total users
    const totalUsers = await User.countDocuments();
    console.log("📊 Total users in database:", totalUsers);

    // Count admin users
    const adminCount = await User.countDocuments({ role: "admin" });
    console.log("👑 Admin users in database:", adminCount);

    if (adminCount === 0) {
      console.log("\n❌ No admin users found!");
      console.log("\n💡 To create an admin user, run:");
      console.log("   node scripts/create-admin.js <email> <password> [username] [surname]");
      console.log("\n   Example:");
      console.log("   node scripts/create-admin.js admin@flighthub.com admin123 Admin User");
    } else {
      console.log("\n✅ Admin users found:\n");
      const admins = await User.find({ role: "admin" }).select("-password");
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Username: ${admin.username} ${admin.surname}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log("");
      });
      
      console.log("💡 To login as admin:");
      console.log("   1. Go to: http://localhost:5173/login");
      console.log("   2. Enter email/username:", admins[0].email);
      console.log("   3. Enter password: admin");
      console.log("   4. Click Login");
    }

    // Check for users with incorrect role
    const usersWithRole = await User.find({ role: { $exists: true } });
    const usersWithoutRole = await User.find({ role: { $exists: false } });
    
    if (usersWithoutRole.length > 0) {
      console.log("⚠️  Warning: Found", usersWithoutRole.length, "users without role field");
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAdmin();


