// routes/passengers.js
import express from "express";
import Passenger from "../models/Passenger.js";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";

const router = express.Router();

// ✅ Create passenger record
router.post("/", async (req, res) => {
  try {
  const { bookingId, seat } = req.body;

    // Normalize/validate seat if provided
    if (seat) {
      const seatStr = String(seat).toUpperCase().trim();
      // Determine valid row range based on flight seat capacity (4 seats per row)
      let startRow = 12;
      let endRow = 23; // default for 48 seats
      try {
        const booking = await Booking.findById(bookingId);
        if (booking?.flightNo) {
          const flight = await Flight.findOne({ flightNo: booking.flightNo });
          if (flight?.seatCapacity && Number.isFinite(flight.seatCapacity)) {
            const totalRows = Math.max(1, Math.ceil(Number(flight.seatCapacity) / 4));
            endRow = startRow + totalRows - 1;
          }
        }
      } catch {}

      const rowPattern = `(${Array.from({ length: endRow - startRow + 1 })
        .map((_, i) => startRow + i)
        .join("|")})`;
      const regex = new RegExp(`^${rowPattern}[ABCD]$`);
      if (!regex.test(seatStr)) {
        return res.status(400).json({ success: false, message: `Invalid seat. Allowed rows ${startRow}-${endRow} and columns A-D (e.g., 14C).` });
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
