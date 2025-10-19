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

    // Ensure booking exists (needed for seat uniqueness across flight instance)
    const parentBooking = await Booking.findById(bookingId).lean();
    if (!parentBooking) {
      return res.status(404).json({ success: false, message: "Booking not found for provided bookingId" });
    }

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
      // Prevent duplicates within the same booking
      const exists = await Passenger.findOne({ bookingId, seat: seatStr });
      if (exists) {
        return res.status(409).json({ success: false, message: "Seat already taken for this booking." });
      }

      // Prevent duplicates across other active (non-cancelled) bookings for the same flight instance
      // Identify all bookings for same flightNo and exact departure that are not cancelled
      const sameInstanceBookings = await Booking.find({
        flightNo: parentBooking.flightNo,
        departure: parentBooking.departure,
        status: { $ne: "cancelled" },
      }).select("_id").lean();
      const sameIds = sameInstanceBookings.map(b => b._id);
      // If this booking is in the list, that's fine; we already checked within-booking above
      const taken = await Passenger.findOne({ bookingId: { $in: sameIds }, seat: seatStr });
      if (taken) {
        return res.status(409).json({ success: false, message: "Seat already taken for this flight." });
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

// ✅ Get occupied seats for a flight instance (ignores cancelled bookings)
// Query params: flightNo=XY123&departure=2025-10-19T12:00:00.000Z
router.get("/occupied", async (req, res) => {
  try {
    const { flightNo, departure } = req.query;
    if (!flightNo || !departure) {
      return res.status(400).json({ success: false, message: "flightNo and departure are required" });
    }
    const dep = new Date(departure);
    if (isNaN(dep.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid departure datetime" });
    }
    const bookings = await Booking.find({
      flightNo,
      departure: dep,
      status: { $ne: "cancelled" },
    }).select("_id").lean();
    const ids = bookings.map(b => b._id);
    if (!ids.length) return res.json({ success: true, seats: [] });
    const pax = await Passenger.find({ bookingId: { $in: ids } }).select("seat -_id").lean();
    const seats = pax.map(p => p.seat).filter(Boolean);
    res.json({ success: true, seats });
  } catch (err) {
    console.error("GET /api/passengers/occupied error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// (Seat availability endpoint removed)

export default router;
