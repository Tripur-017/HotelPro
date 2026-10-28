import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import createToken from "../utils/createToken.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
      return res.status(400).json({ message: "Name, email, password, and password confirmation are required." });
    }
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash, phone: phone || "", role: "customer" });
    const safeUser = { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    res.status(201).json({ token: createToken(user), user: safeUser });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role } });
});

export default router;
