import express from "express";
import Slide from "../models/Slide.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads", "slides");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// Public: list active slides sorted by order
router.get("/", async (req, res) => {
  try {
    const slides = await Slide.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, slides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: create slide
router.post("/", async (req, res) => {
  try {
    const { imageUrl, title = "", subtitle = "", order = 0, active = true } = req.body || {};
    if (!imageUrl) return res.status(400).json({ success: false, message: "imageUrl is required" });
    const slide = await Slide.create({ imageUrl, title, subtitle, order, active });
    res.status(201).json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: upload image file and create slide in one go
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file uploaded" });
    const publicPath = `/uploads/slides/${req.file.filename}`;
    const { title = "", subtitle = "", order = 0, active = true } = req.body || {};
    const slide = await Slide.create({ imageUrl: publicPath, title, subtitle, order, active });
    res.status(201).json({ success: true, slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: update slide
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Slide.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true, slide: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: delete slide
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Slide.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Slide not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
