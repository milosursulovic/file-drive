import FileEntry from "../../models/FileEntry.js";

export default async function () {
  const entries = await FileEntry.find({ category: { $exists: false } });

  for (const entry of entries) {
    entry.category = "Ostalo";
    await entry.save();
    console.log(`Updated entry: ${entry.originalname} → category: Ostalo`);
  }

  console.log(`Završeno. Ukupno ažurirano: ${entries.length}`);
}
