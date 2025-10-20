// routes/bookings.js
import express from "express";
import jwt from "jsonwebtoken";
import Booking from "../models/Booking.js";
import Passenger from "../models/Passenger.js";
import { sendEmail } from "../src/utils/mailer.js";
import { generateTicketPdf } from "../src/utils/ticketPdf.js";
// Removed rich HTML email for boarding pass to keep email simple with a single PDF attachment
import auth from "../src/apis/middleware/auth.middleware.js";

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

// ✅ Create booking (login required)
router.post("/", auth, async (req, res) => {
  try {
    console.log("📥 Received booking request:", req.body);
    
    // Include user email in booking data and force status to 'pending' on creation
    const { status: _ignoredStatus, ...rest } = req.body || {};
    const bookingData = {
      ...rest,
      // Do not force a guest email; prefer explicit userEmail/email or leave undefined
      userEmail: rest.userEmail || rest.email,
      bookingDate: new Date(),
      status: "pending",
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

// ✅ Get payment status for a booking (lightweight)
// Place BEFORE the generic ":id" route to avoid routing conflicts
router.get("/:id/status", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).select(
      "status paymentStatus paymentMethod paymentAmount paymentCurrency paymentId bookingDate price userEmail"
    );
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    res.json({
      success: true,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      paymentAmount: booking.paymentAmount,
      paymentCurrency: booking.paymentCurrency,
      paymentId: booking.paymentId,
      bookingDate: booking.bookingDate,
      price: booking.price,
      userEmail: booking.userEmail,
      id: booking._id,
    });
  } catch (err) {
    console.error("❌ Error fetching booking payment status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Optional: Get bookings by email (login required)
router.get("/by-email", auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email parameter required" });
    }
    
    console.log(`Fetching bookings for email: ${email}`);
    const bookings = await Booking.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, bookings, count: bookings.length });
  } catch (err) {
    console.error("Error fetching bookings by email:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Get all bookings for user (login required, uses userEmail)
router.get("/", auth, async (req, res) => {
  try {
    const userEmail = req.query.userEmail;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "userEmail query parameter is required" });
    }
    console.log(`Fetching bookings for user: ${userEmail}`);
    const bookings = await Booking.find({ userEmail }).sort({ createdAt: -1 }).lean();
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
router.delete("/:id", auth, async (req, res) => {
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
router.put("/:id", auth, async (req, res) => {
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
      const allowed = ["pending", "confirmed", "cancelled"]; // allow full lifecycle
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

    // Email notifications based on status changes
    try {
      const recipient = bookingWithPassengers.userEmail;
      if (recipient) {
        if (update.status === "confirmed") {
          // Generate a single PDF attachment and send a simple email body
          const pdfBuffer = await generateTicketPdf(bookingWithPassengers);
          await sendEmail({
            to: recipient,
            subject: `Your ticket is confirmed - ${bookingWithPassengers.flightNo || "Flight"}`,
            text: `Dear customer,\n\nYour booking (${bookingWithPassengers._id}) has been confirmed. Your boarding pass is attached as a PDF.\n\nRoute: ${bookingWithPassengers.from} → ${bookingWithPassengers.to}\nDeparture: ${new Date(bookingWithPassengers.departure).toLocaleString("en-IN")}\n\nThank you for choosing us.`,
            attachments: [
              {
                filename: `BoardingPass-${bookingWithPassengers.flightNo || "Flight"}-${String(bookingWithPassengers._id).slice(-6)}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });
        } else if (update.status === "cancelled") {
          // Send cancellation message only
          await sendEmail({
            to: recipient,
            subject: `Your booking was cancelled - ${bookingWithPassengers.flightNo || "Flight"}`,
            text: `Dear customer,\n\nYour booking (${bookingWithPassengers._id}) has been cancelled. No ticket will be issued.\n\nIf this was unexpected, please contact support.`,
          });
        }
      }
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
      // Don't fail the update if email fails
    }

    res.json({ success: true, booking: bookingWithPassengers });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Send ticket PDF via email (client-generated PDF)
router.post("/:id/email", auth, async (req, res) => {
  try {
    const { to, filename, pdfBase64 } = req.body || {};
    const bookingDoc = await Booking.findById(req.params.id);
    const booking = bookingDoc ? bookingDoc.toObject() : null;
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const recipient = to || booking.userEmail;
    if (!recipient) {
      return res.status(400).json({ success: false, message: "Recipient email is required" });
    }

    let attachmentBuffer;
    let attachFilename = filename || `BoardingPass-${booking.flightNo || "Flight"}-${String(booking._id).slice(-6)}.pdf`;

    if (pdfBase64) {
      // Use client-provided PDF
      const base64 = String(pdfBase64).includes(",") ? String(pdfBase64).split(",")[1] : String(pdfBase64);
      try {
        attachmentBuffer = Buffer.from(base64, "base64");
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid PDF content" });
      }
    } else {
      // Fallback: generate server-side PDF with improved layout and full passengers
      const passengers = await Passenger.find({ bookingId: booking._id });
      const withPassengers = { ...booking, passengers };
      attachmentBuffer = await generateTicketPdf(withPassengers);
    }

    await sendEmail({
      to: recipient,
      subject: `Your boarding pass - ${booking.flightNo || "Flight"}`,
      text: `Dear customer,\n\nAttached is your boarding pass for booking ${booking._id}.\n\nThank you for choosing us.`,
      attachments: [
        {
          filename: attachFilename,
          content: attachmentBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    res.json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
