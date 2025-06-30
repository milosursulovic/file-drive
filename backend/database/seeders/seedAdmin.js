import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../../models/User.js";

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = new User({
    username: "admin",
    passwordHash,
    role: "admin",
  });

  await admin.save();
  console.log("✅ Admin user created");
  mongoose.disconnect();
};

createAdmin();
