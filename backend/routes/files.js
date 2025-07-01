import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { verifyToken } from '../middlewares/auth.js'

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('uploads')
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  },
})

const upload = multer({ storage })

router.get('/', verifyToken, (req, res) => {
  const dirPath = path.join('uploads')

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).json({ msg: 'Greška pri čitanju foldera' })
    }

    const fileList = files.map((filename) => ({
      name: filename,
      url: `/uploads/${filename}`,
    }))

    res.json(fileList)
  })
})

router.get('/download/:filename', verifyToken, (req, res) => {
  const filename = req.params.filename
  const filePath = path.join('uploads', filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ msg: 'Fajl ne postoji' })
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(500).json({ msg: 'Greška pri preuzimanju fajla' })
    }
  })
})

router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'Izaberite fajl' })
  }

  res.json({
    msg: 'Fajl sačuvan uspešno',
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
  })
})

export default router
