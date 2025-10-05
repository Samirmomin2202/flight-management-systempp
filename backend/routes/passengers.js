// routes/passengers.js
import express from "express";
import Passenger from "../models/Passenger.js";

const router = express.Router();

// ✅ Create passenger record
router.post("/", async (req, res) => {
  try {
    const { bookingId, seat } = req.body;

    // Normalize/validate seat if provided
    if (seat) {
      const seatStr = String(seat).toUpperCase().trim();
      // Accept rows 12-23 and columns A-D (2–2 layout)
      const match = seatStr.match(/^(1[2-9]|2[0-3])[ABCD]$/);
      if (!match) {
        return res.status(400).json({ success: false, message: "Invalid seat format. Expected 12-23 with columns A-D (e.g., 14C)." });
      }
      req.body.seat = seatStr;
      // Prevent duplicates for same booking
      const exists = await Passenger.findOne({ bookingId, seat: seatStr });
      if (exists) {
        return res.status(409).json({ success: false, message: "Seat already taken for this booking." });
      }
    }

    const passenger = await Passenger.create(req.body);
    res.json({ success: true, passenger });
  } catch (err) {
    console.error("POST /api/passengers error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Seat already taken for this booking." });
    }
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

// (Seat availability endpoint removed)

export default router;
