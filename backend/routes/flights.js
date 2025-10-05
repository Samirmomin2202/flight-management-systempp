import express from "express";
import { getFlights, addFlight, updateFlight, deleteFlight } from "../controllers/flightController.js";

const router = express.Router();

router.get("/", getFlights);
router.post("/", addFlight);
router.put("/:id", updateFlight);
router.delete("/:id", deleteFlight);


export default router;
