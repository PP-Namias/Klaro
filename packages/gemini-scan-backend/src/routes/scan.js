const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const storage = require('../storage');
const geminiClient = require('../geminiClient');
const db = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/scan', upload.array('file'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'missing_file' });
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    const scanId = metadata.requestId || uuidv4();

    // save files to storage
    const saved = [];
    for (const f of req.files) {
      const out = await storage.saveFile(scanId, f.originalname, f.buffer);
      saved.push(out);
    }

    // call Gemini (stubbed if not configured)
    const result = await geminiClient.processImages(saved, metadata, { requestId: scanId });

    // persist
    await db.saveResult(scanId, result);

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'model_error', message: err.message });
  }
});

router.get('/scan/:scanId', async (req, res) => {
  const scanId = req.params.scanId;
  const result = await db.getResult(scanId);
  if (!result) return res.status(404).json({ error: 'not_found' });
  res.json(result);
});

module.exports = router;
