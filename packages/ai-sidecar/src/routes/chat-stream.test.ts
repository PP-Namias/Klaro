import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('GET /api/chat/stream', () => {
  it('returns 400 when question is missing', async () => {
    const res = await request(app).get('/api/chat/stream');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('question query parameter is required');
  });

  it('returns 400 when messages is invalid JSON', async () => {
    const res = await request(app).get(
      '/api/chat/stream?question=hello&messages=not-json',
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid messages JSON');
  });

  it('returns SSE content-type headers', async () => {
    const res = await request(app)
      .get('/api/chat/stream?question=test')
      .buffer(true)
      .parse((res, cb) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          cb(null, data);
        });
      });

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.headers['connection']).toBe('keep-alive');
  });
});
