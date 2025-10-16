import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarBase64: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
