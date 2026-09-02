const request = require('supertest');
const http = require('http');
const path = require('path');

const app = require('../src/index');

/**
 * The presigned-upload path was removed for compliance: it let an unauthenticated
 * caller name an arbitrary URL that the service would then PUT raw medical image
 * bytes to (SSRF + PHI exfiltration), and it persisted documents outside the
 * request. Medical documents are now processed in memory only (RA 10173).
 *
 * This suite pins that removal: a request that still supplies
 * metadata.storage_presign_url must succeed and must make no outbound PUT.
 */
describe('POST /api/scan ignores storage_presign_url', () => {
  let server;
  let uploadServer;
  let uploadPort;
  let putRequests;

  beforeAll(async () => {
    putRequests = 0;
    await new Promise((resolve) => {
      // A listener that records any PUT it receives. It must stay at zero.
      uploadServer = http.createServer((req, res) => {
        if (req.method === 'PUT') {
          putRequests += 1;
          req.on('data', () => {});
          req.on('end', () => res.end('ok'));
        } else {
          res.statusCode = 404;
          res.end('not found');
        }
      }).listen(0, () => {
        uploadPort = uploadServer.address().port;
        server = app.listen(0, resolve);
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      uploadServer.close(() => server.close(resolve));
    });
  });

  it('completes the scan without uploading the image anywhere', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const presignTemplate = `http://127.0.0.1:${uploadPort}/upload/{filename}`;

    const res = await request(server)
      .post('/api/scan')
      .field('metadata', JSON.stringify({ requestId: 'presign123', storage_presign_url: presignTemplate }))
      .attach('file', fixture, 'sample.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requestId', 'presign123');

    // The image was never PUT to the caller-supplied URL.
    expect(putRequests).toBe(0);

    // ...and no descriptor carries a location the bytes could be fetched from.
    for (const image of res.body.images || []) {
      expect(image).not.toHaveProperty('url');
      expect(image).not.toHaveProperty('path');
    }
  });
});
