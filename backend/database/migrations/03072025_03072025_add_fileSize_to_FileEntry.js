import fs from "fs";
import path from "path";
import FileEntry from "../../models/FileEntry.js";

const uploadsDir = path.resolve("uploads");

export default async function () {
  const entries = await FileEntry.find({ size: { $exists: false } });

  let updated = 0;

  for (const entry of entries) {
    const filePath = path.join(uploadsDir, entry.filename);

    try {
      const stats = fs.statSync(filePath);
      entry.size = stats.size;
      await entry.save();
      console.log(`Updated ${entry.originalname} → ${stats.size} B`);
      updated++;
    } catch (err) {
      console.warn(`Preskačem: ${entry.originalname} (nije pronađen)`);
    }
  }

  console.log(`Završeno. Ukupno ažurirano: ${updated}`);
}
