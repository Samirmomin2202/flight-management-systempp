import mongoose from "mongoose";

const flightSchema = new mongoose.Schema({
  flightNo: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departure: { type: Date, required: true },
  arrival: { type: Date, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Flight", flightSchema);
