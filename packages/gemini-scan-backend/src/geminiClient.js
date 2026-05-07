// Minimal Gemini client stub. If GEMINI_API_KEY is set, you can extend this
// to call the real Gemini Vision API. For testing and portability this
// currently returns a deterministic mock response following the schema.
const path = require('path');

async function processImages(images, metadata = {}, opts = {}) {
  // Build a deterministic mock response using the images info
  const requestId = opts.requestId || metadata.requestId || 'req_mock_1';
  const now = Date.now();
  const pages = images.map((im, idx) => ({
    page: idx + 1,
    text: `Mock OCR for ${path.basename(im.path || im.url)}`,
    rotationDegrees: im.rotationDegrees || 0,
    layout: []
  }));

  const result = {
    requestId,
    status: 'success',
    documentType: metadata.task === 'verify_id' ? 'id_card' : 'other',
    extractionScore: 0.95,
    fields: {
      sampleField: { value: 'mockValue', confidence: 0.99 }
    },
    tables: [],
    pages,
    images,
    warnings: [],
    error: null,
    processingMs: 200
  };

  return result;
}

module.exports = { processImages };
