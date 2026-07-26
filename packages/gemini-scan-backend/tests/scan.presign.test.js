const request = require('supertest');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = require('../src/index');

describe('POST /api/scan with presigned upload', () => {
  let server;
  let uploadServer;
  let uploadPort;

  beforeAll(async () => {
    // start a tiny server to accept PUT uploads
    await new Promise((resolve) => {
      uploadServer = http.createServer((req, res) => {
        if (req.method === 'PUT') {
          let received = 0;
          req.on('data', (chunk) => { received += chunk.length; });
          req.on('end', () => res.end('ok'));
        } else {
          res.statusCode = 404; res.end('not found');
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

  it('uploads file to presigned URL and returns result', async () => {
    const fixture = path.join(__dirname, 'fixtures', 'sample.jpg');
    const presignTemplate = `http://127.0.0.1:${uploadPort}/upload/{filename}`;

    const res = await request(server)
      .post('/api/scan')
      .field('metadata', JSON.stringify({ requestId: 'presign123', storage_presign_url: presignTemplate }))
      .attach('file', fixture, 'sample.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requestId', 'presign123');
    expect(Array.isArray(res.body.images) || Array.isArray(res.body.pages) || res.body.fields).toBeTruthy();
  });
});
