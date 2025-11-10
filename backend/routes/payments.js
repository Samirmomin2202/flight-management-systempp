// Mock payment routes for local testing
import express from "express";
import PaymentIntent from "../models/PaymentIntent.js";
import Booking from "../models/Booking.js";
import { sendEmail } from "../src/utils/mailer.js";

const router = express.Router();

/**
 * POST /api/payments/mock
 * Simulates a payment without external gateway integration
 * 
 * Body: {
 *   bookingId: string (required),
 *   paymentMethod?: string (default: "mock"),
 *   amount?: number (optional, uses booking price if not provided)
 * }
 */
router.post("/mock", async (req, res) => {
  try {
    const { bookingId, paymentMethod = "mock", amount } = req.body;

    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: "bookingId is required" 
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    // Check if already paid
    if (booking.paymentStatus === "completed") {
      return res.status(400).json({ 
        success: false, 
        message: "Booking is already paid" 
      });
    }

    // Use provided amount or booking price
    const paymentAmount = amount || booking.price || 0;

    // Create payment intent record
    const paymentIntent = await PaymentIntent.create({
      flightNo: booking.flightNo,
      from: booking.from,
      to: booking.to,
      departure: booking.departure,
      arrival: booking.arrival,
      price: paymentAmount,
      passengersCount: booking.passengers || 1,
      userEmail: booking.userEmail,
      passengers: [], // Can be populated from Passenger model if needed
    });

    // Update booking with payment info
    booking.paymentStatus = "completed";
    booking.paymentId = paymentIntent._id.toString();
    booking.paymentMethod = paymentMethod;
    booking.paymentAmount = paymentAmount;
    booking.paymentCurrency = "INR";
    booking.paymentCapturedAt = new Date();
    booking.status = "confirmed";
    await booking.save();

    // Send booking confirmation email (local simulation)
    if (booking.userEmail) {
      try {
        await sendEmail({
          to: booking.userEmail,
          subject: "Booking Confirmation - Flight Management System",
          html: `
            <h2>Booking Confirmed!</h2>
            <p>Your flight booking has been confirmed.</p>
            <h3>Booking Details:</h3>
            <ul>
              <li><strong>Booking ID:</strong> ${booking._id}</li>
              <li><strong>Flight:</strong> ${booking.flightNo}</li>
              <li><strong>Route:</strong> ${booking.from} → ${booking.to}</li>
              <li><strong>Departure:</strong> ${new Date(booking.departure).toLocaleString()}</li>
              <li><strong>Arrival:</strong> ${new Date(booking.arrival).toLocaleString()}</li>
              <li><strong>Passengers:</strong> ${booking.passengers || 1}</li>
              <li><strong>Amount Paid:</strong> ₹${paymentAmount}</li>
              <li><strong>Payment Method:</strong> ${paymentMethod}</li>
            </ul>
            <p>Thank you for choosing our flight management system!</p>
          `,
          text: `
            Booking Confirmed!
            
            Booking ID: ${booking._id}
            Flight: ${booking.flightNo}
            Route: ${booking.from} → ${booking.to}
            Departure: ${new Date(booking.departure).toLocaleString()}
            Arrival: ${new Date(booking.arrival).toLocaleString()}
            Passengers: ${booking.passengers || 1}
            Amount Paid: ₹${paymentAmount}
            Payment Method: ${paymentMethod}
            
            Thank you for choosing our flight management system!
          `,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the payment if email fails
      }
    }

    res.status(200).json({
      success: true,
      status: "success",
      bookingId: booking._id.toString(),
      paymentId: paymentIntent._id.toString(),
      message: "Payment processed successfully (mock mode)",
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        paymentAmount,
      },
    });
  } catch (err) {
    console.error("Mock payment error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Payment processing failed",
      error: err.message 
    });
  }
});

export default router;

