import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { verifyToken } from "../middlewares/auth.js";
import FileEntry from "../models/FileEntry.js";

const uploadsDir = path.join("uploads");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join("uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

const getClientIp = (req) =>
  (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").replace(
    "::ffff:",
    ""
  );

router.get("/", verifyToken, async (req, res) => {
  const ip = getClientIp(req);
  const entries = await FileEntry.find({ ip }).sort({ timestamp: -1 });
  res.json(
    entries.map((e) => ({
      name: e.filename,
      original: e.originalname,
      category: e.category,
      timestamp: e.timestamp,
    }))
  );
});

router.get("/by-ip/:ip", verifyToken, async (req, res) => {
  const requestingUser = req.user;

  if (requestingUser.role !== "admin") {
    return res.status(403).json({ msg: "Pristup zabranjen" });
  }

  const ip = req.params.ip;
  const entries = await FileEntry.find({ ip }).sort({ timestamp: -1 });

  res.json(
    entries.map((e) => ({
      name: e.filename,
      original: e.originalname,
      category: e.category,
      timestamp: e.timestamp,
    }))
  );
});

router.get("/download/:filename", verifyToken, async (req, res) => {
  const ip = getClientIp(req);
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  const entry = await FileEntry.findOne({ filename });

  if (!entry) return res.status(404).json({ msg: "Fajl ne postoji" });

  if (entry.ip !== ip && req.user?.role !== "admin") {
    return res.status(403).json({ msg: "Nemaš pravo na ovaj fajl" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ msg: "Fajl fizički ne postoji" });
  }

  res.download(filePath);
});

router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "Izaberite fajl" });

  const ip = getClientIp(req);

  const category = req.body.category || "Ostalo";

  const entry = new FileEntry({
    filename: req.file.filename,
    originalname: req.file.originalname,
    ip,
    category,
  });

  await entry.save();

  res.json({
    msg: "Fajl uspešno sačuvan",
    filename: entry.filename,
    originalname: entry.originalname,
    ip,
  });
});

router.delete("/:filename", verifyToken, async (req, res) => {
  const ip = getClientIp(req);
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  const entry = await FileEntry.findOne({ filename });
  if (!entry) return res.status(404).json({ msg: "Fajl nije pronađen" });

  if (entry.ip !== ip) {
    return res
      .status(403)
      .json({ msg: "Nemate dozvolu za brisanje ovog fajla" });
  }

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await FileEntry.deleteOne({ filename });

  res.json({ msg: "Fajl uspešno obrisan" });
});

export default router;
