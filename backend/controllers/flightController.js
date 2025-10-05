import Flight from "../models/Flight.js";

// Sample flights to add if database is empty
const sampleFlights = [
  {
    flightNo: "AI101",
    from: "Delhi",
    to: "Mumbai", 
    departure: new Date("2025-12-15T06:00:00Z"),
    arrival: new Date("2025-12-15T08:00:00Z"),
    price: 5500
  },
  {
    flightNo: "AI102", 
    from: "Mumbai",
    to: "Bangalore",
    departure: new Date("2025-12-15T10:00:00Z"),
    arrival: new Date("2025-12-15T12:30:00Z"),
    price: 4200
  },
  {
    flightNo: "AI103",
    from: "Bangalore",
    to: "Chennai",
    departure: new Date("2025-12-15T14:00:00Z"), 
    arrival: new Date("2025-12-15T15:30:00Z"),
    price: 3800
  },
  {
    flightNo: "AI104",
    from: "Chennai",
    to: "Kolkata",
    departure: new Date("2025-12-15T16:00:00Z"),
    arrival: new Date("2025-12-15T18:30:00Z"),
    price: 6200
  },
  {
    flightNo: "AI105",
    from: "Delhi",
    to: "Bangalore", 
    departure: new Date("2025-12-16T08:00:00Z"),
    arrival: new Date("2025-12-16T11:00:00Z"),
    price: 7500
  }
];

// GET all flights
export const getFlights = async (req, res) => {
  try {
    let flights = await Flight.find();
    
    // If no flights exist, add sample flights
    if (flights.length === 0) {
      console.log("📊 No flights found, adding sample flights...");
      await Flight.insertMany(sampleFlights);
      flights = await Flight.find();
      console.log("✅ Sample flights added successfully!");
    }
    
    res.json({ success: true, flights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD a flight
export const addFlight = async (req, res) => {
  try {
    const { flightNo, from, to, departure, arrival, price } = req.body;

    // Check for duplicate flightNo
    const exists = await Flight.findOne({ flightNo });
    if (exists) return res.status(400).json({ success: false, message: "Flight number already exists!" });

    const flight = new Flight({ flightNo, from, to, departure, arrival, price });
    await flight.save();

    res.json({ success: true, message: "Flight added successfully", flight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE a flight
export const updateFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: "Flight updated successfully", flight });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE a flight
export const deleteFlight = async (req, res) => {
  try {
    await Flight.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Flight deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
