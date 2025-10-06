import mongoose from "mongoose";

const SlideSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Slide = mongoose.model("Slide", SlideSchema);
export default Slide;
