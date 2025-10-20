// models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  flightNo: String,
  from: String,
  to: String,
  departure: Date,
  arrival: Date,
  price: Number,
  passengers: Number,
  userEmail: String, // Add user email for access control
  bookingDate: { type: Date, default: Date.now },
  // Booking status lifecycle: pending (default) -> confirmed | cancelled
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  // Payment info
  paymentStatus: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  paymentId: { type: String },
  paymentMethod: { type: String },
  paymentAmount: { type: Number },
  paymentCurrency: { type: String },
  paymentCapturedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
