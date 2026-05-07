const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

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

module.exports = { saveFile };
