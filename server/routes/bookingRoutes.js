import { Router } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function parseDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { roomId, checkIn: checkInText, checkOut: checkOutText } = req.body;
    if (!mongoose.isValidObjectId(roomId)) return res.status(400).json({ message: "Choose a valid room." });
    const checkIn = parseDate(checkInText);
    const checkOut = parseDate(checkOutText);
    if (!checkIn || !checkOut || checkOut <= checkIn) return res.status(400).json({ message: "Check-out must be after check-in. Select valid dates." });
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today) return res.status(400).json({ message: "Check-in cannot be in the past." });
    const room = await Room.findOne({ _id: roomId, active: true });
    if (!room) return res.status(404).json({ message: "This room is unavailable." });

    // Date intervals overlap when existing check-in < requested check-out AND existing check-out > requested check-in.
    const conflict = await Booking.findOne({
      room: room._id, status: "confirmed", checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn }
    });
    if (conflict) return res.status(409).json({ message: "This room is already booked for some of those dates. Please choose another room or dates." });

    const numberOfNights = Math.round((checkOut - checkIn) / 86400000);
    const bookingId = `HP-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const booking = await Booking.create({
      bookingId, user: req.user._id, room: room._id, checkIn, checkOut,
      numberOfNights, totalAmount: numberOfNights * room.pricePerNight,
      status: "confirmed", paymentStatus: "not_required"
    });
    const populated = await Booking.findById(booking._id).populate("room", "roomNumber type pricePerNight");
    res.status(201).json({ booking: populated, message: "Booking confirmed. No real payment was processed." });
  } catch (error) { next(error); }
});

router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate("room", "roomNumber type pricePerNight").sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.patch("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid booking." });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (req.user.role !== "admin" && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot cancel another customer's booking." });
    }
    if (booking.status !== "confirmed") return res.status(400).json({ message: "This booking is already cancelled." });
    booking.status = "cancelled";
    await booking.save();
    res.json({ booking, message: "Booking cancelled." });
  } catch (error) { next(error); }
});

export default router;
