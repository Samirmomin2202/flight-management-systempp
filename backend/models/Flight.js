import mongoose from "mongoose";

const flightSchema = new mongoose.Schema({
  flightNo: { type: String, required: true, unique: true },
  airline: { type: String },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departure: { type: Date, required: true },
  arrival: { type: Date, required: true },
  price: { type: Number, required: true },
  seatCapacity: { type: Number, default: 48 }, // total seats available (2–2 layout)
  cabinClass: { type: String, enum: ["Economy", "Premium Economy", "Business", "First"], default: "Economy" },
}, { timestamps: true });

export default mongoose.model("Flight", flightSchema);
