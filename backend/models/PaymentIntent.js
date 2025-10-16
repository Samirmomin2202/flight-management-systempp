import mongoose from "mongoose";

const PassengerSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    seat: String,
    gender: String,
    passengerType: { type: String, default: "Adult" },
  },
  { _id: false }
);

const PaymentIntentSchema = new mongoose.Schema(
  {
    flightNo: String,
    from: { type: String, required: true },
    to: { type: String, required: true },
    departure: Date,
    arrival: Date,
    price: { type: Number, required: true },
    passengersCount: { type: Number, required: true },
    userEmail: String,
    passengers: [PassengerSchema],
  },
  { timestamps: true }
);

export default mongoose.model("PaymentIntent", PaymentIntentSchema);
