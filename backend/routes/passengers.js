// routes/passengers.js
import express from "express";
import Passenger from "../models/Passenger.js";

const router = express.Router();

// ✅ Create passenger record
router.post("/", async (req, res) => {
  try {
    const passenger = await Passenger.create(req.body);
    res.json({ success: true, passenger });
  } catch (err) {
    console.error("POST /api/passengers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get all passengers for a booking
router.get("/booking/:bookingId", async (req, res) => {
  try {
    const passengers = await Passenger.find({ bookingId: req.params.bookingId });
    res.json({ success: true, passengers });
  } catch (err) {
    console.error("GET /api/passengers/booking/:bookingId error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
