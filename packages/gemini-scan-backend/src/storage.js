const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

const BASE = process.env.STORAGE_BASE_PATH || path.join(__dirname, '..', 'data', 'uploads');

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }); } catch (e) {}
}

async function saveFile(scanId, filename, buffer) {
  const dir = path.join(BASE, scanId);
  await ensureDir(dir);
  const filePath = path.join(dir, filename);
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
