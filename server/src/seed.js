import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/User.js";

await mongoose.connect(process.env.MONGO_URI);

const authorities = [
  { name: "Roads Officer", email: "roads@civiceye.test", department: "Roads" },
  { name: "Water Officer", email: "water@civiceye.test", department: "Water" },
  { name: "Admin", email: "admin@civiceye.test", role: "admin" },
];

const passwordHash = await bcrypt.hash("Password123", 10);

for (const a of authorities) {
  await User.updateOne(
    { email: a.email },
    { $set: { passwordHash, role: a.role || "authority", ...a } },
    { upsert: true }
  );
}

console.log("Seeded authority users (password: Password123)");
await mongoose.disconnect();