import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  numberOfNights: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  paymentStatus: { type: String, enum: ["not_required", "simulated"], default: "not_required" }
}, { timestamps: true });

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1, status: 1 });
export default mongoose.model("Booking", bookingSchema);
