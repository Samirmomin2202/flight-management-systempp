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
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // your React dev server
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Note: static uploads removed after undoing slides feature

// Simple health check
app.get('/api/test', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Routes
app.use("/api/flights", flightsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/passengers", passengersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
// app.use("/api/slides", slidesRoutes); // removed
// User routes (signup/login)
app.use("/api/user", userRoute);
app.use("/user", userRoute);

// Fallback JSON 404 handler to avoid HTML responses
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// MongoDB connection with dev-friendly fallback
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri || mongoUri === "your-atlas-uri-here") {
      console.warn("⚠️  MONGO_URI not set. Starting in-memory MongoDB for development...");
      // Lazy import to avoid dependency if not needed in production
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log("🧪 Using in-memory MongoDB instance");
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
    console.log("📍 Database:", mongoose.connection.name);

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    console.error("🔧 Ensure MongoDB is available or set a valid MONGO_URI in backend/.env");
    process.exit(1);
  }
}

startServer();