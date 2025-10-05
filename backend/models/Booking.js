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
  status: { type: String, default: "confirmed" }, // confirmed, cancelled
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
