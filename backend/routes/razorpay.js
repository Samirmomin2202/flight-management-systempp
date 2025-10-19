import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import PaymentIntent from "../models/PaymentIntent.js";
import Booking from "../models/Booking.js";
import Passenger from "../models/Passenger.js";
import auth from "../src/apis/middleware/auth.middleware.js";

const router = express.Router();

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing in backend/.env");
  }
  return new Razorpay({ key_id, key_secret });
}

// Create order from intent (pay first flow)
// Require login to initiate a payment/booking intent
router.post("/create-order-intent", auth, async (req, res) => {
  try {
    const { flightNo, from, to, departure, arrival, price, passengersCount, userEmail, passengers } = req.body;
    if (!from || !to || passengersCount == null) {
      return res.status(400).json({ success: false, message: "Missing required fields: from, to, passengersCount" });
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ success: false, message: "Invalid price. Must be a positive number." });
    }
    const intent = await PaymentIntent.create({
      flightNo,
      from,
      to,
      departure,
      arrival,
      price: numericPrice,
      passengersCount,
      userEmail,
      passengers,
    });

    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create({
      amount: Math.round(numericPrice * 100), // amount in paise
      currency: "INR",
      receipt: intent._id.toString(),
      notes: { flightNo: flightNo || "", userEmail: userEmail || "" },
    });

    res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID, intentId: intent._id.toString() });
  } catch (err) {
    console.error("Razorpay create-order-intent error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, message: err?.response?.data || err.message });
  }
});

// Verify payment and create booking
// Require login to verify and create a booking
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, intentId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !intentId) {
      return res.status(400).json({ success: false, message: "Missing verification parameters" });
    }
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) return res.status(500).json({ success: false, message: "RAZORPAY_KEY_SECRET not configured" });

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", key_secret).update(payload).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Load intent and create booking
    const intent = await PaymentIntent.findById(intentId);
    if (!intent) return res.status(400).json({ success: false, message: "Invalid intent" });

    const b = await Booking.create({
      flightNo: intent.flightNo,
      from: intent.from,
      to: intent.to,
      departure: intent.departure,
      arrival: intent.arrival,
      price: intent.price,
      passengers: intent.passengersCount,
      userEmail: intent.userEmail,
      bookingDate: new Date(),
      status: "confirmed",
      paymentStatus: "completed",
      paymentId: razorpay_payment_id,
      paymentMethod: "razorpay",
      paymentAmount: intent.price,
      paymentCurrency: "INR",
      paymentCapturedAt: new Date(),
    });

    if (Array.isArray(intent.passengers) && intent.passengers.length) {
      const mapped = intent.passengers.map((p, idx) => ({
        bookingId: b._id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        seat: p.seat,
        gender: p.gender,
        passengerType: p.passengerType || "Adult",
      }));
      await Passenger.insertMany(mapped);
    }

    await PaymentIntent.findByIdAndDelete(intent._id);

    res.json({ success: true, bookingId: b._id.toString() });
  } catch (err) {
    console.error("Razorpay verify error:", err?.response?.data || err.message);
    res.status(500).json({ success: false, message: err?.response?.data || err.message });
  }
});

export default router;

// Diagnostics endpoint: creates a tiny order to verify Razorpay credentials
router.get('/diagnostics', async (req, res) => {
  try {
    const rzp = getRazorpayInstance();
    // create a minimal order of Rs. 1 (100 paise)
    const order = await rzp.orders.create({ amount: 100, currency: 'INR', receipt: 'diagnostic' });
    res.json({ success: true, orderId: order.id, status: order.status });
  } catch (err) {
    console.error('Razorpay diagnostics error:', err?.message || err);
    res.status(500).json({ success: false, message: err?.message || err });
  }
});

