import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { verifyToken } from "../middlewares/auth.js";
import FileEntry from "../models/FileEntry.js";
import { Parser } from "json2csv";
import XLSX from "xlsx";

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
  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { ip };

  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const total = await FileEntry.countDocuments(query);
  const entries = await FileEntry.find(query)
    .sort({ timestamp: sort })
    .skip(skip)
    .limit(limit);

  res.json({
    files: entries.map((e) => ({
      name: e.filename,
      original: e.originalname,
      category: e.category,
      timestamp: e.timestamp,
      size: e.size,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/by-ip", verifyToken, async (req, res) => {
  const requestingUser = req.user;

  if (requestingUser.role !== "admin") {
    return res.status(403).json({ msg: "Pristup zabranjen" });
  }

  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;
  const ip = req.query.ip;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!ip) {
    return res.status(400).json({ msg: "IP adresa je obavezna" });
  }

  let query = { ip };

  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const total = await FileEntry.countDocuments(query);
  const entries = await FileEntry.find(query)
    .sort({ timestamp: sort })
    .skip(skip)
    .limit(limit);

  res.json({
    files: entries.map((e) => ({
      name: e.filename,
      original: e.originalname,
      category: e.category,
      timestamp: e.timestamp,
      size: e.size,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
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
    size: req.file.size,
  });

  await entry.save();

  res.json({
    msg: "Fajl uspešno sačuvan",
    filename: entry.filename,
    originalname: entry.originalname,
    ip,
    size: entry.size,
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

router.get("/export/csv", verifyToken, async (req, res) => {
  const user = req.user;
  const ip = getClientIp(req);
  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;

  let query = {};

  if (user.role === "admin" && req.query.ip) {
    query.ip = req.query.ip;
  } else {
    query.ip = ip;
  }

  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const files = await FileEntry.find(query).sort({ timestamp: sort });

  const fields = [
    { label: "Originalno ime", value: "originalname" },
    { label: "Ime fajla", value: "filename" },
    { label: "IP adresa", value: "ip" },
    { label: "Kategorija", value: "category" },
    { label: "Datum", value: (row) => row.timestamp.toISOString() },
    { label: "Veličina (B)", value: "size" },
  ];

  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(files);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=fajlovi.csv");
  res.status(200).end(csv);
});

router.get("/export/xlsx", verifyToken, async (req, res) => {
  const user = req.user;
  const ip = getClientIp(req);
  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;

  let query = {};

  if (user.role === "admin" && req.query.ip) {
    query.ip = req.query.ip;
  } else {
    query.ip = ip;
  }

  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const files = await FileEntry.find(query).sort({ timestamp: sort });

  const data = files.map((e) => ({
    Naziv: e.originalname,
    Fajl: e.filename,
    Kategorija: e.category || "Ostalo",
    IP: e.ip,
    DatumDodavanja: new Date(e.timestamp).toLocaleString("sr-RS"),
    Velicina: e.size || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fajlovi");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  res.setHeader("Content-Disposition", `attachment; filename=fajlovi.xlsx`);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

router.get("/by-ip/export/csv", verifyToken, async (req, res) => {
  const requestingUser = req.user;
  if (requestingUser.role !== "admin") {
    return res.status(403).json({ msg: "Pristup zabranjen" });
  }

  const ip = req.query.ip;
  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;

  if (!ip) {
    return res.status(400).json({ msg: "IP adresa je obavezna" });
  }

  const query = { ip };
  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const entries = await FileEntry.find(query).sort({ timestamp: sort });

  const data = entries.map((e) => ({
    Naziv: e.originalname,
    Fajl: e.filename,
    Kategorija: e.category || "Ostalo",
    IP: e.ip,
    DatumDodavanja: new Date(e.timestamp).toLocaleString("sr-RS"),
    Velicina: e.size || "",
  }));

  const parser = new Parser({ delimiter: ";" });
  const csv = parser.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment(`fajlovi-${ip}.csv`);
  res.send(csv);
});

router.get("/by-ip/export/xlsx", verifyToken, async (req, res) => {
  const user = req.user;
  if (user.role !== "admin")
    return res.status(403).json({ msg: "Pristup zabranjen" });

  const ip = req.query.ip;
  const search = req.query.search?.toLowerCase() || "";
  const sort = req.query.sort === "asc" ? 1 : -1;

  if (!ip) return res.status(400).json({ msg: "IP adresa je obavezna" });

  const query = { ip };
  if (search) {
    query.originalname = { $regex: search, $options: "i" };
  }

  const entries = await FileEntry.find(query).sort({ timestamp: sort });

  const data = entries.map((e) => ({
    Naziv: e.originalname,
    Fajl: e.filename,
    Kategorija: e.category || "Ostalo",
    IP: e.ip,
    DatumDodavanja: new Date(e.timestamp).toLocaleString("sr-RS"),
    Velicina: e.size || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Fajlovi");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=fajlovi-${ip}.xlsx`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

export default router;
