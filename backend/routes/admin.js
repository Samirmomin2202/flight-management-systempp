// routes/admin.js
import express from "express";
import Booking from "../models/Booking.js";
import Passenger from "../models/Passenger.js";
import Flight from "../models/Flight.js";
import User from "../src/models/user.model.js";

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

// ✅ Admin stats (totals and weekly trend)
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Last 7 days window (including today)
    const startWindow = new Date(startOfToday);
    startWindow.setDate(startWindow.getDate() - 6);

    // Parallel counts
    const [totalFlights, registeredUsers, bookingsToday] = await Promise.all([
      Flight.countDocuments({}),
      User.countDocuments({}),
      Booking.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    // Revenue aggregations
    const [totalRevenueAgg, revenueTodayAgg] = await Promise.all([
      Booking.aggregate([
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } },
      ]),
    ]);
    const totalRevenue = totalRevenueAgg[0]?.sum || 0;
    const revenueToday = revenueTodayAgg[0]?.sum || 0;

    // Aggregations for last 7 days
    // Flights per day (by departure)
    const flightAgg = await Flight.aggregate([
      { $match: { departure: { $gte: startWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$departure" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Bookings per day (by createdAt)
    const bookingAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue per day (sum price by createdAt)
    const revenueAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sum: { $sum: { $ifNull: ["$price", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build ordered arrays for the 7-day window
    const labels = [];
    const data = [];
    const bookingsData = [];
    const revenueData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startWindow);
      d.setDate(startWindow.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const found = flightAgg.find((f) => f._id === key);
      const foundB = bookingAgg.find((b) => b._id === key);
      const foundR = revenueAgg.find((r) => r._id === key);
      const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
      labels.push(dayShort);
      data.push(found ? found.count : 0);
      bookingsData.push(foundB ? foundB.count : 0);
      revenueData.push(foundR ? foundR.sum : 0);
    }

    res.json({
      success: true,
      stats: {
        totalFlights,
        bookingsToday,
        registeredUsers,
        totalRevenue,
        revenueToday,
        weeklyFlights: { labels, data },
        weeklyBookings: bookingsData,
        weeklyRevenue: revenueData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
