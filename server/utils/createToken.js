import jwt from "jsonwebtoken";
export default function createToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
}
