const fs = require('fs/promises');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const collectionPath = path.join(root, 'postman', 'gemini-scan-backend.collection.json');

function getFetch() {
  if (typeof fetch === 'function') return fetch;
  return import('node-fetch').then((mod) => mod.default);
}

async function ensureCollection() {
  try {
    await fs.access(collectionPath);
  } catch {
    require('./generate-postman');
  }
}

function waitForHealth(url, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) return resolve();
        if (Date.now() - started > timeoutMs) return reject(new Error('Timed out waiting for server health'));
        setTimeout(tick, 500);
      }).on('error', () => {
        if (Date.now() - started > timeoutMs) return reject(new Error('Timed out waiting for server health'));
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function run() {
  await ensureCollection();
  const collection = JSON.parse(await fs.readFile(collectionPath, 'utf8'));
  const fetchImpl = await getFetch();
  const serverProcess = spawn(process.execPath, [path.join(root, 'src', 'index.js')], {
    cwd: root,
    env: { ...process.env, PORT: process.env.PORT || '3001', MOCK_GEMINI: 'true' },
    stdio: 'inherit'
  });

  try {
    await waitForHealth(`${collection.variable.find((v) => v.key === 'baseUrl').value}/health`);

    const baseUrl = collection.variable.find((v) => v.key === 'baseUrl').value;
    const sampleFilePath = collection.variable.find((v) => v.key === 'sampleFilePath').value;
    const metadata = { requestId: 'sample-scan', task: 'extract_invoice_fields', language: 'en' };

    const fileBuffer = await fs.readFile(sampleFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', fileBlob, path.basename(sampleFilePath));
    formData.append('metadata', JSON.stringify(metadata));

    const postResponse = await fetchImpl(`${baseUrl}/api/scan`, {
      method: 'POST',
      body: formData
    });

    if (!postResponse.ok) {
      throw new Error(`POST /api/scan failed with ${postResponse.status}`);
    }

    const postJson = await postResponse.json();
    if (!postJson.requestId || !postJson.status) {
      throw new Error('POST /api/scan returned an invalid JSON payload');
    }

    const getResponse = await fetchImpl(`${baseUrl}/api/scan/${encodeURIComponent(postJson.requestId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!getResponse.ok) {
      throw new Error(`GET /api/scan/:scanId failed with ${getResponse.status}`);
    }

    const getJson = await getResponse.json();
    if (getJson.requestId !== postJson.requestId) {
      throw new Error('Stored scan result did not round-trip correctly');
    }

    console.log('Postman-style API validation completed successfully');
  } finally {
    serverProcess.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
