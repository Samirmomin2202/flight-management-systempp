// routes/admin.js
import express from "express";
import Booking from "../models/Booking.js";
import Passenger from "../models/Passenger.js";

const router = express.Router();

// ✅ Get all bookings with passengers
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookingDate: -1 }).lean();

    // Attach passengers to each booking
    const bookingIds = bookings.map((b) => b._id);
    const passengers = await Passenger.find({
      bookingId: { $in: bookingIds },
    }).lean();

    const bookingsWithPassengers = bookings.map((b) => ({
      ...b,
      passengers: passengers.filter(
        (p) => p.bookingId.toString() === b._id.toString()
      ),
    }));

    res.json({ success: true, bookings: bookingsWithPassengers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
