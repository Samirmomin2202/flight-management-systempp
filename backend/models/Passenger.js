// models/Passenger.js
import mongoose from "mongoose";

const passengerSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
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

export default mongoose.model("Passenger", passengerSchema);
