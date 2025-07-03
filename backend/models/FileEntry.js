import mongoose from "mongoose";

const fileEntrySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  ip: { type: String, required: true },
  category: {
    type: String,
    enum: ["Dokument", "Slika", "Backup", "Log", "Ostalo"],
    default: "Ostalo",
  },
  timestamp: { type: Date, default: Date.now },
  size: { type: Number },
});

export default mongoose.model("FileEntry", fileEntrySchema);
