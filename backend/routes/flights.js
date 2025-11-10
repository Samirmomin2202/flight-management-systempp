import express from "express";
import { getFlights, addFlight, updateFlight, deleteFlight } from "../controllers/flightController.js";
import { requireAdmin } from "../src/apis/middleware/isAdmin.middleware.js";

const router = express.Router();

// Public route - anyone can view flights
router.get("/", getFlights);

// Admin-only routes for flight management
router.post("/", requireAdmin, addFlight);
router.put("/:id", requireAdmin, updateFlight);
router.delete("/:id", requireAdmin, deleteFlight);


export default router;
