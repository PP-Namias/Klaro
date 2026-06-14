const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

const BASE = process.env.STORAGE_BASE_PATH || path.join(__dirname, '..', 'data', 'uploads');

function sanitizePathSegment(value) {
  if (typeof value !== 'string') return 'unknown';
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 128);
}

function safePath(base, ...segments) {
  const resolved = path.resolve(base, ...segments);
  const baseResolved = path.resolve(base);
  if (!resolved.startsWith(baseResolved + path.sep) && resolved !== baseResolved) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }); } catch (e) {}
}

async function saveFile(scanId, filename, buffer) {
  const safeScanId = sanitizePathSegment(scanId);
  const safeFilename = sanitizePathSegment(filename);
  const dir = path.join(BASE, safeScanId);
  await ensureDir(dir);
  const filePath = safePath(dir, safeFilename);
  await fs.writeFile(filePath, buffer);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  // return a local url-like path
  return {
    inputName: 'file',
    url: `file://${filePath}`,
    path: filePath,
    hash,
    width: 0,
    height: 0,
    rotationDegrees: 0
  };
}

async function uploadToPresignedUrl(scanId, filename, buffer, presignTemplate) {
  // presignTemplate can be a full URL or a template containing {filename}
  const url = presignTemplate.includes('{filename}') ? presignTemplate.replace('{filename}', encodeURIComponent(filename)) : presignTemplate;
  const fetchImpl = await getFetch();
  const res = await fetchImpl(url, { method: 'PUT', body: buffer, headers: { 'Content-Type': 'application/octet-stream' } });
  if (!res.ok) throw new Error(`Presign upload failed ${res.status}`);
  // Return the public URL (assume the presign url is the public URL)
  return {
    inputName: 'file',
    url,
    path: null,
    hash: crypto.createHash('sha256').update(buffer).digest('hex'),
    width: 0,
    height: 0,
    rotationDegrees: 0
  };
}

module.exports = { saveFile, uploadToPresignedUrl };
