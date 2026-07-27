const fs = require('fs/promises');
const path = require('path');

const RESULTS = process.env.RESULTS_PATH || path.join(__dirname, '..', 'data', 'results');

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

async function saveResult(id, obj) {
  const safeId = sanitizePathSegment(id);
  await ensureDir(RESULTS);
  const fp = safePath(RESULTS, `${safeId}.json`);
  await fs.writeFile(fp, JSON.stringify(obj, null, 2));
}

async function getResult(id) {
  try {
    const safeId = sanitizePathSegment(id);
    const fp = safePath(RESULTS, `${safeId}.json`);
    const txt = await fs.readFile(fp, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

module.exports = { saveResult, getResult };
