const path = require('path');
const fs = require('fs/promises');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompts');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MOCK_GEMINI = process.env.MOCK_GEMINI === 'true' || !GEMINI_API_KEY;

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

function mimeTypeFromName(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

async function readImageAsBase64(image) {
  if (image.buffer) {
    return {
      base64: image.buffer.toString('base64'),
      mimeType: image.mimetype || mimeTypeFromName(image.filename || image.path || image.url || '')
    };
  }

  const filePath = image.path || (typeof image.url === 'string' && image.url.startsWith('file://') ? image.url.replace('file://', '') : null);
  if (!filePath) {
    throw new Error(`Unsupported image input: ${JSON.stringify({ filename: image.filename, url: image.url })}`);
  }

  const buffer = await fs.readFile(filePath);
  return {
    base64: buffer.toString('base64'),
    mimeType: image.mimetype || mimeTypeFromName(image.filename || filePath)
  };
}

function normalizeJsonCandidate(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(jsonText);
}

async function processImages(images, metadata = {}, opts = {}) {
  const requestId = opts.requestId || metadata.requestId || 'req_mock_1';
  const startedAt = Date.now();

  if (MOCK_GEMINI) {
    const pages = images.map((im, idx) => ({
      page: idx + 1,
      text: `Mock OCR for ${path.basename(im.path || im.url || im.filename || 'image')}`,
      rotationDegrees: im.rotationDegrees || 0,
      layout: []
    }));

    return {
      requestId,
      status: 'success',
      documentType: metadata.task === 'verify_id' ? 'id_card' : 'other',
      extractionScore: 0.95,
      fields: {
        sampleField: { value: 'mockValue', confidence: 0.99 }
      },
      tables: [],
      pages,
      images,
      warnings: [],
      error: null,
      processingMs: Date.now() - startedAt
    };
  }

  const fetchImpl = await getFetch();
  const inlineParts = [];
  for (const image of images) {
    const asset = await readImageAsBase64(image);
    inlineParts.push({ inlineData: { mimeType: asset.mimeType, data: asset.base64 } });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{
      role: 'user',
      parts: [{ text: buildUserPrompt(metadata) }, ...inlineParts]
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const parsed = normalizeJsonCandidate(text) || {};
  parsed.requestId = parsed.requestId || requestId;
  parsed.images = parsed.images || images;
  parsed.processingMs = parsed.processingMs || (Date.now() - startedAt);
  return parsed;
}

module.exports = { processImages };
