 
import dotenv from "dotenv";
import mongoose from "mongoose";
import Room from "../models/Room.js";

dotenv.config();

const samples = [
  {
    roomNumber: "101",
    type: "Standard",
    description: "A comfortable, thoughtfully designed room for a relaxing stay.",
    pricePerNight: 2499,
    capacity: 2,
    features: ["Queen bed", "Wi-Fi", "Air conditioning"]
  },
  {
    roomNumber: "202",
    type: "Deluxe",
    description: "A spacious room with premium finishes and a calm city view.",
    pricePerNight: 3999,
    capacity: 2,
    features: ["King bed", "City view", "Wi-Fi", "Breakfast area"]
  },
  {
    roomNumber: "303",
    type: "Suite",
    description: "An elegant suite with a separate sitting area for extra comfort.",
    pricePerNight: 6499,
    capacity: 3,
    features: ["King bed", "Lounge area", "Wi-Fi", "Mini fridge"]
  },
  {
    roomNumber: "404",
    type: "Family",
    description: "A flexible family room with generous space for everyone.",
    pricePerNight: 4999,
    capacity: 4,
    features: ["Two beds", "Family seating", "Wi-Fi", "Air conditioning"]
  },
  {
    roomNumber: "105",
    type: "Standard",
    description: "A welcoming room designed for a comfortable short stay.",
    pricePerNight: 2299,
    capacity: 2,
    features: ["Queen bed", "Wi-Fi", "Air conditioning"]
  },
  {
    roomNumber: "106",
    type: "Deluxe",
    description: "A stylish room with extra space and modern amenities.",
    pricePerNight: 3499,
    capacity: 2,
    features: ["King bed", "Wi-Fi", "Smart TV"]
  },
  {
    roomNumber: "205",
    type: "Suite",
    description: "A spacious suite ideal for guests seeking extra comfort.",
    pricePerNight: 5999,
    capacity: 3,
    features: ["King bed", "Lounge area", "Mini fridge"]
  },
  {
    roomNumber: "206",
    type: "Family",
    description: "A family-friendly room with space for a group stay.",
    pricePerNight: 4599,
    capacity: 4,
    features: ["Two beds", "Wi-Fi", "Air conditioning"]
  },
  {
    roomNumber: "305",
    type: "Deluxe",
    description: "A peaceful deluxe room with premium comfort and facilities.",
    pricePerNight: 3799,
    capacity: 2,
    features: ["King bed", "City view", "Wi-Fi"]
  },
  {
    roomNumber: "405",
    type: "Suite",
    description: "An upgraded suite with a relaxing atmosphere and extra space.",
    pricePerNight: 6999,
    capacity: 3,
    features: ["King bed", "Lounge area", "Wi-Fi", "Mini fridge"]
  }
];

try {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const room of samples) {
    await Room.updateOne(
      { roomNumber: room.roomNumber },
      { $setOnInsert: room },
      { upsert: true }
    );
  }

  console.log("All 10 sample room records are ready.");
} catch (error) {
  console.error("Room seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
