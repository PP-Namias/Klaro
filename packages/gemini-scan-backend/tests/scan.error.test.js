const request = require('supertest');

const app = require('../src/index');

describe('POST /api/scan error cases', () => {
  it('returns 400 when missing file', async () => {
    const res = await request(app).post('/api/scan');
    expect(res.statusCode).toBe(400);
  });
});
