const request = require('supertest');
const path = require('path');
const fs = require('fs');

const app = require('../src/index');

describe('POST /api/scan with JSON base64 images', () => {
  it('accepts JSON images and returns a JSON result', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const data = fs.readFileSync(fixture);
    const base64 = data.toString('base64');

    const res = await request(app)
      .post('/api/scan')
      .send({ images: [{ filename: 'sample.jpg', bytesBase64: base64 }], metadata: { requestId: 'json123' } })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requestId', 'json123');
  });
});
