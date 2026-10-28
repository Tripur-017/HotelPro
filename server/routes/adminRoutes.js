import { Router } from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/bookings", async (_req, res, next) => {
  try {
    const bookings = await Booking.find().populate("user", "name email").populate("room", "roomNumber type pricePerNight").sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.get("/users", async (_req, res, next) => {
  try {
    const users = await User.find().select("name email phone role createdAt").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) { next(error); }
});

export default router;
