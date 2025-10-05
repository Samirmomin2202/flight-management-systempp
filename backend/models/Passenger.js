// models/Passenger.js
import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  // Persist selected seat per passenger (e.g., "14C")
  seat: {
    type: String,
    trim: true,
  },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  country: String,
  state: String,
  city: String,
  pincode: String,
  dob: Date,
  gender: String,
  passengerType: String,
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate seat assignments within the same booking
passengerSchema.index({ bookingId: 1, seat: 1 }, { unique: true, sparse: true });

export default mongoose.model("Passenger", passengerSchema);
