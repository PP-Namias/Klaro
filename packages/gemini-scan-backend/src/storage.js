// Medical documents are processed ephemerally and are NEVER written to disk or
// to a database (Philippine Data Privacy Act, RA 10173). This module therefore
// performs no filesystem writes; image bytes live only in the request buffer.
const crypto = require('crypto');

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
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

module.exports = { uploadToPresignedUrl };
