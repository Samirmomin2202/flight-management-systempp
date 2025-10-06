// routes/bookings.js
import express from "express";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Passenger from "../models/Passenger.js";

const router = express.Router();

// Middleware to verify JWT token and extract user info
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid token." });
  }
};

// ✅ Create booking
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received booking request:", req.body);
    
    // Include user email in booking data
    const bookingData = {
      ...req.body,
      // Do not force a guest email; prefer explicit userEmail/email or leave undefined
      userEmail: req.body.userEmail || req.body.email,
      bookingDate: new Date(),
      status: "confirmed"
    };
    
    console.log("💾 Creating booking with data:", bookingData);
    const booking = await Booking.create(bookingData);
    console.log("✅ Booking created successfully with ID:", booking._id);
    
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error creating booking:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Optional: Get bookings by email (for legacy support)
router.get("/by-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter required" });
    }
    
    console.log(`Fetching bookings for email: ${email}`);
    const bookings = await Booking.find({ userEmail: email }).sort({ createdAt: -1 });
    
    res.json({ success: true, bookings, count: bookings.length });
  } catch (err) {
    console.error("Error fetching bookings by email:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get all bookings for user (requires userEmail)
router.get("/", async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail query parameter is required" });
    }
    console.log(`Fetching bookings for user: ${userEmail}`);
    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 });
    console.log(`Found ${bookings.length} bookings for user ${userEmail}`);
    res.json({ success: true, bookings, count: bookings.length });
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get single booking by id (no authentication required for simplified flow)
router.get("/:id", async (req, res) => {
  try {
    console.log("🔍 Fetching booking details for ID:", req.params.id);
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      console.log("❌ Booking not found for ID:", req.params.id);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Public-first view: return booking and passengers without strict auth
    const passengers = await Passenger.find({ bookingId: booking._id });
    console.log("✅ Found passengers:", passengers?.length || 0);

    res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        passengers,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Delete booking + passengers
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    await Passenger.deleteMany({ bookingId: booking._id });
    await Booking.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Booking canceled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Update booking (admin/editor)
router.put("/:id", async (req, res) => {
  try {
    const { flightNo, from, to, departure, arrival, status, passengers, userEmail } = req.body;

    const update = {};
    if (flightNo !== undefined) update.flightNo = flightNo;
    if (from !== undefined) update.from = from;
    if (to !== undefined) update.to = to;
    if (departure !== undefined) update.departure = departure ? new Date(departure) : null;
    if (arrival !== undefined) update.arrival = arrival ? new Date(arrival) : null;
    // Disallow price updates via this route
    if (status !== undefined) {
      const allowed = ["confirmed", "cancelled"]; // restrict to confirmation/cancellation
      if (!allowed.includes(String(status).toLowerCase())) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(", ")}` });
      }
      update.status = String(status).toLowerCase();
    }
    if (passengers !== undefined) update.passengers = passengers;
    if (userEmail !== undefined) update.userEmail = userEmail;

    const updated = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Booking not found" });

    // Also return passengers so clients can keep names/seat data in view
    const passengersList = await Passenger.find({ bookingId: updated._id });
    const bookingWithPassengers = {
      ...updated.toObject(),
      passengers: passengersList,
    };

    res.json({ success: true, booking: bookingWithPassengers });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
