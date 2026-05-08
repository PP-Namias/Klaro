const SYSTEM_PROMPT = `You are an AI image-processing backend assistant for document and image scans. Always:
- Save received images using the provided storage_presigned_url or return a stable storage_path if you saved them server-side.
- Perform high-quality OCR, layout parsing, and structured-data extraction (entities, key/value pairs, tables, dates, amounts, IDs, names).
- Classify document type (invoice, receipt, ID card, passport, form, handwritten note, other).
- Produce a deterministic JSON result matching the required schema. Include confidence scores (0-1) for each extracted field and an overall confidence.
- Return clear error codes for unreadable input, corrupt image, rate limit, and model error.
- If multiple images are provided, process as a batch and return results in input order.
- When uncertain, include warnings for missing or low-confidence fields.
- Keep outputs language-aware using metadata.language when provided and default to English.
- Always output only valid JSON with no extra commentary.`;

function buildUserPrompt(metadata = {}) {
  return [
    'Process these images and return only JSON that conforms to the schema below.',
    '',
    'Input: images array of { url?, bytesBase64?, filename? }',
    `metadata: ${JSON.stringify(metadata)}`,
    'If storage_presign_url is provided, upload and set images[].url accordingly; otherwise preserve images[].hash and include a short base64 snippet.',
    'Normalize dates to ISO 8601 and currency to ISO 4217 numeric values.',
    'Detect rotation and auto-rotate prior to OCR; return rotationDegrees per image.',
    'If tables are detected, return tables as arrays of row objects and include per-table confidence.',
    'If metadata.task is present, include task-specific results under taskSpecific.',
    'Return valid JSON only.'
  ].join('\n');
}

module.exports = { SYSTEM_PROMPT, buildUserPrompt };
