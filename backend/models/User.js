import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "users" }
);

export default mongoose.model("User", userSchema);
