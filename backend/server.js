import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import flightsRoutes from "./routes/flights.js";
import bookingsRoutes from "./routes/bookings.js";
import passengersRoutes from "./routes/passengers.js";
import adminRoutes from "./routes/admin.js";
import userRoute from "./src/apis/users/user.route.js";
import contactRoutes from "./routes/contact.js";
import paymentsRoutes from "./routes/payments.js";
import razorpayRoutes from "./routes/razorpay.js";
import slidesRoutes from "./routes/slides.js";
import aiRoutes from "./routes/ai.js";
import { sendEmail, emailProviderInfo } from "./src/utils/mailer.js";
import path from "path";
import { fileURLToPath } from "url";
import connectDb from "./src/config/db.config.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // your React dev server
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
// Increase body size limits to support base64 avatars (approx <= 2MB)
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Note: static uploads removed after undoing slides feature

// Simple health check
app.get('/api/test', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Email diagnostic route (no auth, disable in production or guard later)
app.get('/api/email/test', async (req, res) => {
  const info = emailProviderInfo();
  // Quick provider snapshot
  if (req.query.info === 'true') {
    return res.json({ ok: true, info });
  }
  const to = req.query.to || process.env.TEST_EMAIL_TO || info?.provider === 'SMTP' ? emailConfig?.auth?.user : undefined;
  if (!to) {
    return res.status(400).json({ ok: false, message: 'Provide ?to=recipient@example.com or set TEST_EMAIL_TO in env' });
  }
  const result = await sendEmail({
    to,
    subject: 'Email test (' + info.provider + ')',
    text: 'Plain text test at ' + new Date().toISOString(),
    html: '<strong>Email test</strong><br/>' + new Date().toISOString()
  });
  if (result.error) {
    return res.status(500).json({ ok: false, provider: info.provider, error: result.error });
  }
  res.json({ ok: true, provider: info.provider, result });
});

// Routes
app.use("/api/flights", flightsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/passengers", passengersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/razorpay", razorpayRoutes);
app.use("/api/slides", slidesRoutes);
app.use("/api/ai", aiRoutes);
// User routes (signup/login)
app.use("/api/user", userRoute);
app.use("/user", userRoute);

// Fallback JSON 404 handler to avoid HTML responses
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// MongoDB connection (requires MONGO_URI)
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await connectDb();
    console.log("✅ MongoDB connected successfully");
    console.log("📍 Database:", mongoose.connection.name);
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    console.error("🔧 Set a valid MONGO_URI in backend/.env to persist data in MongoDB");
    process.exit(1);
  }
})();