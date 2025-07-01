import mongoose from 'mongoose'

const fileEntrySchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

export default mongoose.model('FileEntry', fileEntrySchema)
