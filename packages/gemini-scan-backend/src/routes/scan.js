const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');
const storage = require('../storage');
const geminiClient = require('../geminiClient');
const db = require('../db');

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 10;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB decoded

function sanitizePathSegment(value) {
  if (typeof value !== 'string') return 'unknown';
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 128);
}

function isLikelyBase64(value) {
  if (typeof value !== 'string') return false;
  const sanitized = value.replace(/[\r\n\s]/g, '');
  if (sanitized.length < 100 || sanitized.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/=]+$/.test(sanitized);
}

router.post('/scan', upload.array('file'), async (req, res) => {
  try {
    let metadata = {};
    if (req.body && req.body.metadata) {
      metadata = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body.metadata;
    }
    metadata = {
      ...metadata,
      task: metadata.task || 'medical_scan',
      language: metadata.language === 'Filipino' ? 'Filipino' : 'English'
    };
    const scanId = sanitizePathSegment(metadata.requestId) || uuidv4();

    // Support JSON body with images (base64) as well as multipart files
    const saved = [];
    if (req.is('application/json') && req.body && req.body.images) {
      if (!Array.isArray(req.body.images) || req.body.images.length === 0) {
        return res.status(400).json({ error: 'invalid_images', message: 'images[] is required' });
      }
      if (req.body.images.length > MAX_FILES) {
        return res.status(400).json({ error: 'too_many_images', message: `Maximum ${MAX_FILES} images allowed` });
      }

      for (const im of req.body.images) {
        if (!isLikelyBase64(im.bytesBase64)) {
          return res.status(400).json({ error: 'invalid_base64', message: 'images[].bytesBase64 is malformed or empty' });
        }

        const buf = Buffer.from(im.bytesBase64, 'base64');
        if (buf.length > MAX_BASE64_SIZE) {
          return res.status(413).json({ error: 'file_too_large', message: `Image exceeds ${MAX_BASE64_SIZE / 1024 / 1024}MB limit` });
        }
        // save locally
        const out = await storage.saveFile(scanId, sanitizePathSegment(im.filename) || `image-${Date.now()}.jpg`, buf);
        // optionally upload to presigned url
        if (metadata.storage_presign_url) {
          try {
            const uploaded = await storage.uploadToPresignedUrl(scanId, sanitizePathSegment(im.filename) || 'image.jpg', buf, metadata.storage_presign_url);
            out.url = uploaded.url;
          } catch (e) {
            console.warn('presign upload failed', e.message);
          }
        }
        saved.push(out);
      }
    } else {
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'missing_file' });
      for (const f of req.files) {
        // save local copy
        const out = await storage.saveFile(scanId, sanitizePathSegment(f.originalname), f.buffer);
        // optionally upload to presigned url (template may contain {filename})
        if (metadata.storage_presign_url) {
          try {
            const uploaded = await storage.uploadToPresignedUrl(scanId, sanitizePathSegment(f.originalname), f.buffer, metadata.storage_presign_url);
            out.url = uploaded.url;
          } catch (e) {
            console.warn('presign upload failed', e.message);
          }
        }
        saved.push(out);
      }
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
  const scanId = sanitizePathSegment(req.params.scanId);
  const result = await db.getResult(scanId);
  if (!result) return res.status(404).json({ error: 'not_found' });
  res.json(result);
});

module.exports = router;
