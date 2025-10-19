import mongoose from "mongoose";

const SlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    // Store either base64 image data (data URL) or a public URL
    imageBase64: { type: String },
    imageUrl: { type: String },
    ctaText: { type: String, trim: true },
    ctaUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Helpful compound index for sorting and quick active fetches
SlideSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

const Slide = mongoose.model("Slide", SlideSchema);
export default Slide;
