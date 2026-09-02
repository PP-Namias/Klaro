const request = require('supertest');
const fs = require('fs');
const path = require('path');

const app = require('../src/index');

describe('POST /api/scan', () => {
  it('accepts an upload and returns a JSON result', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const res = await request(app)
      .post('/api/scan')
      .attach('file', fixture)
      .field('metadata', JSON.stringify({ requestId: 'test123', task: 'extract_invoice_fields' }));

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requestId');
    expect(res.body).toHaveProperty('status');
    // The full result is delivered in this response and nowhere else.
    expect(res.body).toHaveProperty('fields');
  });

  it('does not persist the scan and exposes no retrieval endpoint', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const res = await request(app)
      .post('/api/scan')
      .attach('file', fixture)
      .field('metadata', JSON.stringify({ requestId: 'noretain1', task: 'medical_scan' }));

    expect(res.statusCode).toBe(200);

    // Zero-storage (RA 10173): nothing is written to disk for this request.
    const dataDir = path.join(__dirname, '..', 'data');
    expect(fs.existsSync(path.join(dataDir, 'results'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'uploads'))).toBe(false);

    // ...and the result cannot be read back by anyone.
    const get = await request(app).get(`/api/scan/${res.body.requestId}`);
    expect(get.statusCode).toBe(404);
  });
});
