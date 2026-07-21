import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { resolve } from 'path';
import { readFileSync } from 'fs';

describe('POST /api/ingest', () => {
  it('returns 400 when no file is provided', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when file type is unsupported', async () => {
    const res = await request(app)
      .post('/api/ingest')
      .attach('file', Buffer.from('not a real file'), 'test.txt');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 when ChromaDB is unavailable (expected)', async () => {
    const pdfPath = resolve(__dirname, '../../test/fixtures/sample.pdf');
    let pdfBuffer: Buffer;

    try {
      pdfBuffer = readFileSync(pdfPath);
    } catch {
      return;
    }

    const res = await request(app)
      .post('/api/ingest')
      .attach('file', pdfBuffer, 'sample.pdf');

    expect(res.status).toBe(500);
  });
});
