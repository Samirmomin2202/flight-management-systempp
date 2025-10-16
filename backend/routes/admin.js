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
    const tz = process.env.ADMIN_TZ || 'Asia/Kolkata';
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    // Build a YYYY-MM-DD key for today's date in the configured timezone
    const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

    // Last 7 days window (including today)
    const startWindow = new Date(startOfToday);
    startWindow.setDate(startWindow.getDate() - 6);

    // Parallel counts
    const [totalFlights, registeredUsers, totalBookings, completedBookingsTotal, cancelledBookingsTotal] = await Promise.all([
      Flight.countDocuments({}),
      User.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ paymentStatus: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
    ]);

    // Bookings today (timezone-aware)
    const bookingsTodayAgg2 = await Booking.aggregate([
      { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const bookingsToday = bookingsTodayAgg2[0]?.count || 0;

    // Revenue aggregations
    const [totalRevenueAgg, totalRevenueCompletedAgg, avgPriceCompletedAgg, totalPassengersAgg] = await Promise.all([
      // All revenue (legacy)
      Booking.aggregate([{ $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } }]),
      // Completed revenue (recommended)
      Booking.aggregate([{ $match: { paymentStatus: "completed" } }, { $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } }]),
      // Average ticket price (completed)
      Booking.aggregate([{ $match: { paymentStatus: "completed" } }, { $group: { _id: null, avg: { $avg: { $ifNull: ["$price", 0] } } } }]),
      // Total passengers (all bookings)
      Booking.aggregate([{ $group: { _id: null, sum: { $sum: { $ifNull: ["$passengers", 0] } } } }]),
    ]);
    const totalRevenue = totalRevenueAgg[0]?.sum || 0;
    const totalRevenueCompleted = totalRevenueCompletedAgg[0]?.sum || 0;
    const avgTicketPriceCompleted = avgPriceCompletedAgg[0]?.avg || 0;
    const totalPassengers = totalPassengersAgg[0]?.sum || 0;

    // Today-only (timezone-aware) revenue/avg/passengers
    const [revenueTodayAgg2, revenueTodayCompletedAgg2, avgPriceTodayCompletedAgg2, todayPassengersAgg2] = await Promise.all([
      Booking.aggregate([
        { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } }
      ]),
      Booking.aggregate([
        { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] }, paymentStatus: "completed" } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$price", 0] } } } }
      ]),
      Booking.aggregate([
        { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] }, paymentStatus: "completed" } },
        { $group: { _id: null, avg: { $avg: { $ifNull: ["$price", 0] } } } }
      ]),
      Booking.aggregate([
        { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$passengers", 0] } } } }
      ]),
    ]);
    const revenueToday = revenueTodayAgg2[0]?.sum || 0;
    const revenueTodayCompleted = revenueTodayCompletedAgg2[0]?.sum || 0;
    const avgTicketPriceTodayCompleted = avgPriceTodayCompletedAgg2[0]?.avg || 0;
    const passengersToday = todayPassengersAgg2[0]?.sum || 0;

    // Aggregations for last 7 days
    // Flights per day (by departure)
    const flightAgg = await Flight.aggregate([
      { $match: { departure: { $gte: startWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$departure", timezone: tz } },
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
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Completed bookings per day
    const bookingCompletedAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow }, paymentStatus: "completed" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Cancelled bookings per day
    const bookingCancelledAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow }, status: "cancelled" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Revenue per day (sum price by createdAt)
    const revenueAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } },
          sum: { $sum: { $ifNull: ["$price", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Completed revenue per day
    const revenueCompletedAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: startWindow }, paymentStatus: "completed" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, sum: { $sum: { $ifNull: ["$price", 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    // Payment status distribution (overall)
    const paymentDistributionAgg = await Booking.aggregate([
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    // Today's payment status breakdown
    const paymentTodayAgg = await Booking.aggregate([
      { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    // Top routes (last 30 days) by count
    const start30 = new Date(startOfToday);
    start30.setDate(start30.getDate() - 29);
    const topRoutesAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: start30 } } },
      { $group: { _id: { from: "$from", to: "$to" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Today's hourly series (timezone-aware labels)
    // Group today's bookings by hour of day in the configured timezone
    const bookingHourlyAgg = await Booking.aggregate([
      { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%H", date: "$createdAt", timezone: tz } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Group today's revenue by hour of day in the configured timezone
    const revenueHourlyAgg = await Booking.aggregate([
      { $match: { $expr: { $eq: [ { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, todayKey ] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%H", date: "$createdAt", timezone: tz } },
          sum: { $sum: { $ifNull: ["$price", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build ordered arrays for the 7-day window
  const labels = [];
  const dateLabels = [];
    const data = [];
    const bookingsData = [];
    const bookingsCompletedData = [];
    const bookingsCancelledData = [];
    const revenueData = [];
    const revenueCompletedData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startWindow);
      d.setDate(startWindow.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const found = flightAgg.find((f) => f._id === key);
      const foundB = bookingAgg.find((b) => b._id === key);
      const foundBC = bookingCompletedAgg.find((b) => b._id === key);
      const foundBX = bookingCancelledAgg.find((b) => b._id === key);
      const foundR = revenueAgg.find((r) => r._id === key);
      const foundRC = revenueCompletedAgg.find((r) => r._id === key);
      const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
      labels.push(dayShort);
      // Human-friendly date label (e.g., 16 Oct)
      dateLabels.push(d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }));
      data.push(found ? found.count : 0);
      bookingsData.push(foundB ? foundB.count : 0);
      bookingsCompletedData.push(foundBC ? foundBC.count : 0);
      bookingsCancelledData.push(foundBX ? foundBX.count : 0);
      revenueData.push(foundR ? foundR.sum : 0);
      revenueCompletedData.push(foundRC ? foundRC.sum : 0);
    }

    res.json({
      success: true,
      stats: {
        totalFlights,
        totalBookings,
        bookingsToday,
        registeredUsers,
        // Revenue (legacy and completed)
        totalRevenue,
        revenueToday,
        totalRevenueCompleted,
        revenueTodayCompleted,
        avgTicketPriceCompleted,
        avgTicketPriceTodayCompleted,
        // Bookings status totals
        completedBookingsTotal,
        cancelledBookingsTotal,
        // Passengers
        totalPassengers,
        passengersToday,
        // Weekly breakdowns
  weeklyFlights: { labels, data },
        weeklyBookings: bookingsData,
        weeklyBookingsCompleted: bookingsCompletedData,
        weeklyBookingsCancelled: bookingsCancelledData,
        weeklyRevenue: revenueData,
        weeklyRevenueCompleted: revenueCompletedData,
  // Daily (7 days) display series (labels are dates like 16 Oct)
  dailyLabels: dateLabels,
  dailyBookings: bookingsData,
  dailyRevenue: revenueData,
        // Payment distributions
        paymentDistribution: paymentDistributionAgg.map(p => ({ status: p._id || "unknown", count: p.count })),
        paymentTodayDistribution: paymentTodayAgg.map(p => ({ status: p._id || "unknown", count: p.count })),
        // Top routes
        topRoutes: topRoutesAgg.map(r => ({ from: r._id.from, to: r._id.to, count: r.count })),
        // Today (hourly) series
        hourlyLabels: Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0')),
        hourlyBookings: Array.from({ length: 24 }, (_, h) => {
          const key = h.toString().padStart(2, '0');
          const found = bookingHourlyAgg.find(b => b._id === key);
          return found ? found.count : 0;
        }),
        hourlyRevenue: Array.from({ length: 24 }, (_, h) => {
          const key = h.toString().padStart(2, '0');
          const found = revenueHourlyAgg.find(r => r._id === key);
          return found ? found.sum : 0;
        }),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
