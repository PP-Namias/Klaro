import request from 'supertest';
import path from 'path';

describe('POST /api/scan normalized medical response', () => {
  let app;

  beforeEach(async () => {
    vi.resetModules();
    process.env.MOCK_GEMINI = 'true';
    const mod = await import('../src/index');
    app = mod.default;
  });

  it('returns the normalized medical analysis contract for JSON uploads', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const res = await request(app)
      .post('/api/scan')
      .send({
        images: [{ filename: 'sample.jpg', bytesBase64: Buffer.from('sample').toString('base64').repeat(30) }],
        metadata: { requestId: 'normalized-1', task: 'medical_scan', language: 'English' },
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body.requestId).toBe('normalized-1');
    expect(res.body.status).toBe('completed');
    expect(res.body.source).toBe('mock');
    expect(res.body).toHaveProperty('plainLanguageSummary');
    expect(res.body).toHaveProperty('urgency');
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  it('returns a retrievable stored result', async () => {
    const res = await request(app)
      .post('/api/scan')
      .send({
        images: [{ filename: 'sample.jpg', bytesBase64: Buffer.from('sample').toString('base64').repeat(30) }],
        metadata: { requestId: 'normalized-2', task: 'medical_scan' },
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    const get = await request(app).get('/api/scan/normalized-2');
    expect(get.statusCode).toBe(200);
    expect(get.body.requestId).toBe('normalized-2');
    expect(get.body.urgency).toBeDefined();
  });
});