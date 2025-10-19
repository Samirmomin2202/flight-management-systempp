import express from "express";
import Slide from "../models/Slide.js";

const router = express.Router();

// Create
router.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    const slide = await Slide.create(payload);
    res.status(201).json({ success: true, slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// List (with optional filters)
router.get("/", async (req, res) => {
  try {
    const { active, limit = 50, page = 1 } = req.query;
    const q = {};
    if (active === "true") q.isActive = true;
    if (active === "false") q.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Slide.find(q).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Slide.countDocuments(q),
    ]);

    res.json({ success: true, slides: items, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get by id
router.get("/:id", async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id).lean();
    if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true, slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const slide = await Slide.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true, slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const slide = await Slide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
