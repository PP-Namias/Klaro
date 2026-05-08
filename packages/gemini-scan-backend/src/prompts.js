function buildSystemPrompt(metadata = {}) {
  const isMedicalScan =
    metadata.task === 'medical_scan' ||
    metadata.domain === 'medical' ||
    metadata.documentType === 'lab_result' ||
    metadata.documentType === 'medical_scan';

  const basePrompt = [
    'You are an AI image-processing backend assistant for document and image scans.',
    'Always save received images using the provided storage_presigned_url or return a stable storage_path if you saved them server-side.',
    'Perform high-quality OCR, layout parsing, and structured-data extraction (entities, key/value pairs, tables, dates, amounts, IDs, names).',
    'Produce a deterministic JSON result matching the required schema. Include confidence scores (0-1) for each extracted field and an overall confidence.',
    'Return clear error codes for unreadable input, corrupt image, rate limit, and model error.',
    'If multiple images are provided, process as a batch and return results in input order.',
    'When uncertain, include warnings for missing or low-confidence fields.',
    'Keep outputs language-aware using metadata.language when provided and default to English.',
    'Always output only valid JSON with no extra commentary.'
  ];

  if (isMedicalScan) {
    basePrompt.push(
      'This is a medical scan workflow. In addition to OCR, extract clinically useful data and produce a patient-facing plain-language summary.',
      'Include summary, urgency, and recommendations in the JSON output.',
      'Urgency must be one of LOW, MODERATE, or HIGH.',
      'Recommendations must be 1 to 3 concise action items prioritised for the patient or clinician.',
      'Be conservative and safe: use HIGH only when the evidence suggests urgent evaluation is needed.'
    );
  }

  return basePrompt.join('\n- ');
}

const SYSTEM_PROMPT = buildSystemPrompt();

function buildUserPrompt(metadata = {}) {
  const isMedicalScan =
    metadata.task === 'medical_scan' ||
    metadata.domain === 'medical' ||
    metadata.documentType === 'lab_result' ||
    metadata.documentType === 'medical_scan';

  const outputInstructions = isMedicalScan
    ? [
        'Return only JSON with this shape:',
        '{',
        '  "requestId": "string",',
        '  "status": "completed",',
        '  "documentType": "string",',
        '  "confidence": 0.0,',
        '  "plainLanguageSummary": "string",',
        '  "urgency": "LOW|MODERATE|HIGH",',
        '  "recommendations": ["string"],',
        '  "warnings": ["string"],',
        '  "fields": {},',
        '  "tables": []',
        '}',
      ].join('\n')
    : [
        'Return only JSON with extraction results, confidence scores, warnings, and any detected tables.',
        'If the document is not medical, do not invent clinical recommendations.',
      ].join('\n');

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
    outputInstructions,
    'Return valid JSON only.'
  ].join('\n');
}

module.exports = { SYSTEM_PROMPT, buildSystemPrompt, buildUserPrompt };
