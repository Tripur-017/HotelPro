import { Router } from "express";
import Room from "../models/Room.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.type && req.query.type !== "All") filter.type = req.query.type;
    const rooms = await Room.find(filter).sort({ pricePerNight: 1 });
    res.json({ rooms });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { roomNumber, type, description, pricePerNight, capacity, features } = req.body;
    if (!roomNumber?.trim() || !type || !description?.trim() || !Number.isFinite(Number(pricePerNight)) || Number(pricePerNight) <= 0 || !Number.isFinite(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({ message: "Enter a room number, type, description, positive price, and valid capacity." });
    }
    const room = await Room.create({
      roomNumber: roomNumber.trim(), type, description: description.trim(),
      pricePerNight: Number(pricePerNight), capacity: Number(capacity),
      features: Array.isArray(features) ? features : String(features || "").split(",").map(x => x.trim()).filter(Boolean)
    });
    res.status(201).json({ room });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That room number already exists." });
    next(error);
  }
});

router.patch("/:id/deactivate", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!room) return res.status(404).json({ message: "Room not found." });
    res.json({ room, message: "Room deactivated." });
  } catch (error) { next(error); }
});

export default router;
