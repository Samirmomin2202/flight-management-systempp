import Booking from "../models/Booking.js";

// Add booking
export const addBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get booking by flightNo
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ flightNo: req.params.flightNo });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
