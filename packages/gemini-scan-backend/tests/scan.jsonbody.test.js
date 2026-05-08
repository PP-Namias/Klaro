const request = require('supertest');
const app = require('../src/index');

describe('POST /api/scan with JSON base64 images', () => {
  it('accepts JSON images and returns a JSON result', async () => {
    // Generate a dummy base64 string that is at least 100 characters long
    const dummyPayload = Buffer.alloc(100, 'x').toString('base64');
    
    // Check length to be sure
    // console.log('Base64 length:', dummyPayload.length);

    const res = await request(app)
      .post('/api/scan')
      .send({ 
        images: [{ filename: 'sample.jpg', bytesBase64: dummyPayload }], 
        metadata: { requestId: 'json123' } 
      })
      .set('Content-Type', 'application/json');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('requestId', 'json123');
  });
});
