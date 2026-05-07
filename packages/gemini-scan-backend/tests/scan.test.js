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
    // saved result should be retrievable
    const get = await request(app).get(`/api/scan/${res.body.requestId}`);
    expect(get.statusCode).toBe(200);
    expect(get.body.requestId).toBe(res.body.requestId);
  });
});
