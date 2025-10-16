import express from "express";
import cors from "cors";
import connectDb from "./src/config/db.config.js";
import userRoute from "./src/apis/users/user.route.js";
import flightsRoutes from "./routes/flights.js";
import bookingsRoutes from "./routes/bookings.js";
import passengersRoutes from "./routes/passengers.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
// import paymentsRoutes from "./routes/payments.js";
import razorpayRoutes from "./routes/razorpay.js";

import dotenv from "dotenv";
dotenv.config();

connectDb();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
	origin: "http://localhost:5173",
	methods: ["GET", "POST", "PUT", "DELETE"],
}));

// Health check
app.get("/api/test", (req, res) => {
	res.json({ ok: true, time: new Date().toISOString() });
});

// API routes
app.use("/api/flights", flightsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/passengers", passengersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
// app.use("/api/payments", paymentsRoutes);
app.use("/api/razorpay", razorpayRoutes);
// User routes (legacy + new)
app.use("/user", userRoute);
app.use("/api/user", userRoute);

// JSON 404 fallback
app.use((req, res) => {
	res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => console.log(`Server running http://localhost:${port}`));
