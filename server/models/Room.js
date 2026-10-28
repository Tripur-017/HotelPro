import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true, enum: ["Standard", "Deluxe", "Suite", "Family"] },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  pricePerNight: { type: Number, required: true, min: 1 },
  capacity: { type: Number, required: true, min: 1, max: 12 },
  features: [{ type: String, trim: true }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);
