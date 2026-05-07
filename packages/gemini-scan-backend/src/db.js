const fs = require('fs/promises');
const path = require('path');

const RESULTS = process.env.RESULTS_PATH || path.join(__dirname, '..', 'data', 'results');

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }); } catch (e) {}
}

async function saveResult(id, obj) {
  await ensureDir(RESULTS);
  const fp = path.join(RESULTS, `${id}.json`);
  await fs.writeFile(fp, JSON.stringify(obj, null, 2));
}

async function getResult(id) {
  try {
    const fp = path.join(RESULTS, `${id}.json`);
    const txt = await fs.readFile(fp, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

module.exports = { saveResult, getResult };
