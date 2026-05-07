const request = require('supertest');
const path = require('path');

const app = require('../src/index');

describe('POST /api/scan with multiple files', () => {
  it('processes multiple uploaded files', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const res = await request(app)
      .post('/api/scan')
      .field('metadata', JSON.stringify({ requestId: 'multi123' }))
      .attach('file', fixture)
      .attach('file', fixture);

    expect(res.statusCode).toBe(200);
    expect(res.body.requestId).toBe('multi123');
  });
});
