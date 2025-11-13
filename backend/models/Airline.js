import mongoose from 'mongoose';

const AirlineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logoUrl: { type: String, required: true }, // full wordmark or main logo
  tailLogoUrl: { type: String }, // optional tail fin variant (like provided image)
  iataCode: { type: String },
  country: { type: String, default: 'India' }
}, { timestamps: true });

export default mongoose.model('Airline', AirlineSchema);
