// Force the offline mock before src/index is required: geminiClient reads
// GEMINI_API_KEY / MOCK_GEMINI at module load, and the shared vitest setup
// defines GEMINI_API_KEY, which would otherwise send a real outbound request.
process.env.MOCK_GEMINI = 'true';

const request = require('supertest');

const app = require('../src/index');

/**
 * body-parser's 100kb default rejected every real photograph before the route
 * ran, so the whole guest scan path silently fell back. These tests pin the
 * raised limit and confirm the route's own size check still applies.
 */
describe('POST /api/scan JSON body limit', () => {
  // Multi-megabyte payloads through supertest are slower than the 5s default.
  const LARGE_PAYLOAD_TIMEOUT_MS = 30000;

  function base64OfBytes(bytes) {
    return Buffer.alloc(bytes, 7).toString('base64');
  }

  it(
    'accepts a JSON image well above the old 100kb parser default',
    async () => {
      // ~2MB decoded => ~2.7MB of base64, far beyond body-parser's default.
      const payload = base64OfBytes(2 * 1024 * 1024);
      expect(payload.length).toBeGreaterThan(100 * 1024);

      const res = await request(app)
        .post('/api/scan')
        .set('Content-Type', 'application/json')
        .send({
          images: [{ bytesBase64: payload, filename: 'lab.jpg' }],
          metadata: { requestId: 'bodylimit-1', task: 'medical_scan' },
        });

      // Reached the route handler rather than being refused by the parser.
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('requestId', 'bodylimit-1');
    },
    LARGE_PAYLOAD_TIMEOUT_MS,
  );

  it(
    "still rejects an image past the route's own decoded-size cap",
    async () => {
      // MAX_BASE64_SIZE is 10MB decoded; 11MB must fail the route check.
      const payload = base64OfBytes(11 * 1024 * 1024);

      const res = await request(app)
        .post('/api/scan')
        .set('Content-Type', 'application/json')
        .send({
          images: [{ bytesBase64: payload, filename: 'huge.jpg' }],
          metadata: { requestId: 'bodylimit-2', task: 'medical_scan' },
        });

      expect(res.statusCode).toBe(413);
      expect(res.body).toHaveProperty('error', 'file_too_large');
    },
    LARGE_PAYLOAD_TIMEOUT_MS,
  );
});
