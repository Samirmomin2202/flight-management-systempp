import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarBase64: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Forgot password fields
    resetOtpHash: { type: String },
    resetOtpExpiresAt: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
