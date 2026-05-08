const path = require('path');
const fs = require('fs/promises');
const { SYSTEM_PROMPT, buildSystemPrompt, buildUserPrompt } = require('./prompts');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MOCK_GEMINI = process.env.MOCK_GEMINI === 'true' || !GEMINI_API_KEY;

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

function mimeTypeFromName(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

async function readImageAsBase64(image) {
  if (image.buffer) {
    return {
      base64: image.buffer.toString('base64'),
      mimeType: image.mimetype || mimeTypeFromName(image.filename || image.path || image.url || '')
    };
  }

  const filePath = image.path || (typeof image.url === 'string' && image.url.startsWith('file://') ? image.url.replace('file://', '') : null);
  if (!filePath) {
    throw new Error(`Unsupported image input: ${JSON.stringify({ filename: image.filename, url: image.url })}`);
  }

  const buffer = await fs.readFile(filePath);
  return {
    base64: buffer.toString('base64'),
    mimeType: image.mimetype || mimeTypeFromName(image.filename || filePath)
  };
}

function normalizeJsonCandidate(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(jsonText);
}

function buildPages(images) {
  return images.map((im, idx) => ({
    page: idx + 1,
    text: `Processed ${path.basename(im.path || im.url || im.filename || 'image')}`,
    rotationDegrees: im.rotationDegrees || 0,
    layout: []
  }));
}

function getMedicalUrgency({ warnings = [], fields = {} } = {}) {
  const warningText = warnings.join(' ').toLowerCase();
  if (/critical|emergency|urgent|acute|immediate/.test(warningText)) return 'HIGH';

  const flaggedCount = Object.values(fields).reduce((count, field) => {
    if (field && typeof field === 'object' && (field.flagged === true || field.severity === 'high')) {
      return count + 1;
    }
    return count;
  }, 0);

  if (flaggedCount >= 2) return 'HIGH';
  if (flaggedCount === 1 || warnings.length > 0) return 'MODERATE';
  return 'LOW';
}

function buildMedicalAnalysis({ warnings = [], fields = {}, documentType = 'medical_scan' }) {
  const urgency = getMedicalUrgency({ warnings, fields });
  const fieldNames = Object.keys(fields).filter((name) => fields[name]);
  const summary = fieldNames.length
    ? `The scan was processed successfully and key items were extracted: ${fieldNames.slice(0, 4).join(', ')}.`
    : 'The scan was processed successfully. No critical structured findings were extracted.';

  const recommendations = urgency === 'HIGH'
    ? [
        'Review this scan with a clinician as soon as possible',
        'Seek urgent care if you have chest pain, severe symptoms, or worsening condition',
        'Bring the scan report and your current medications'
      ]
    : urgency === 'MODERATE'
      ? [
          'Schedule follow-up with your clinician to review the findings',
          'Bring the report and any related prior results',
          'Watch for new or worsening symptoms'
        ]
      : [
          'Keep a copy of the result for your records',
          'Review the findings with your next routine visit',
          'Return for repeat testing if recommended'
        ];

  return {
    status: 'completed',
    documentType,
    confidence: urgency === 'LOW' ? 0.9 : 0.78,
    plainLanguageSummary: summary,
    urgency,
    recommendations,
    warnings,
    analysis: {
      summary,
      urgency,
      recommendations
    }
  };
}

function normalizeProcessedResult({ parsed, images, metadata, requestId, startedAt, source, fallbackWarnings = [] }) {
  const documentType = parsed.documentType || metadata.documentType || (metadata.task === 'medical_scan' ? 'medical_scan' : 'other');
  const fields = parsed.fields || parsed.extractedData || {};
  const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];
  const mergedWarnings = [...fallbackWarnings, ...warnings].filter(Boolean);
  const baseConfidence = typeof parsed.confidence === 'number'
    ? parsed.confidence
    : typeof parsed.extractionScore === 'number'
      ? parsed.extractionScore
      : 0.75;

  const medicalDefaults = metadata.task === 'medical_scan' ? buildMedicalAnalysis({ warnings: mergedWarnings, fields, documentType }) : null;
  const analysis = parsed.analysis || medicalDefaults?.analysis || null;
  const plainLanguageSummary = parsed.plainLanguageSummary || analysis?.summary || medicalDefaults?.plainLanguageSummary || '';
  const urgency = parsed.urgency || analysis?.urgency || medicalDefaults?.urgency || (mergedWarnings.length > 0 ? 'MODERATE' : 'LOW');
  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations
    : analysis?.recommendations || medicalDefaults?.recommendations || [];

  return {
    requestId,
    status: 'completed',
    source,
    documentType,
    extractionScore: baseConfidence,
    confidence: baseConfidence,
    fields,
    extractedData: fields,
    tables: Array.isArray(parsed.tables) ? parsed.tables : [],
    pages: Array.isArray(parsed.pages) ? parsed.pages : buildPages(images),
    images,
    warnings: mergedWarnings,
    plainLanguageSummary,
    urgency,
    recommendations,
    analysis,
    error: null,
    processingMs: parsed.processingMs || (Date.now() - startedAt)
  };
}

function buildFallbackProcessedResult({ images, metadata, requestId, startedAt, source, reason, error }) {
  const isMedical = metadata.task === 'medical_scan';
  const pages = buildPages(images);
  const warnings = [reason, error].filter(Boolean);
  const fields = {};
  const base = isMedical ? buildMedicalAnalysis({ warnings, fields, documentType: metadata.documentType || 'medical_scan' }) : {
    status: 'completed',
    documentType: metadata.documentType || 'other',
    confidence: 0.6,
    plainLanguageSummary: 'The document was processed, but the AI service could not return a structured result. Please try again.',
    urgency: 'MODERATE',
    recommendations: ['Try scanning again', 'Review the document manually'],
    warnings,
    analysis: {
      summary: 'The document was processed, but the AI service could not return a structured result. Please try again.',
      urgency: 'MODERATE',
      recommendations: ['Try scanning again', 'Review the document manually']
    }
  };

  return {
    requestId,
    status: 'completed',
    source,
    documentType: base.documentType,
    extractionScore: base.confidence,
    confidence: base.confidence,
    fields,
    extractedData: fields,
    tables: [],
    pages,
    images,
    warnings: base.warnings || warnings,
    plainLanguageSummary: base.plainLanguageSummary,
    urgency: base.urgency,
    recommendations: base.recommendations,
    analysis: base.analysis,
    error: null,
    processingMs: Date.now() - startedAt
  };
}

async function processImages(images, metadata = {}, opts = {}) {
  const requestId = opts.requestId || metadata.requestId || 'req_mock_1';
  const startedAt = Date.now();
  const taskMetadata = {
    ...metadata,
    task: metadata.task || 'medical_scan'
  };

  if (MOCK_GEMINI) {
    return buildFallbackProcessedResult({
      images,
      metadata: taskMetadata,
      requestId,
      startedAt,
      source: 'mock',
      reason: 'mock_gemini_enabled'
    });
  }

  const fetchImpl = await getFetch();
  const inlineParts = [];
  for (const image of images) {
    const asset = await readImageAsBase64(image);
    inlineParts.push({ inlineData: { mimeType: asset.mimeType, data: asset.base64 } });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const payload = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(taskMetadata) || SYSTEM_PROMPT }] },
    contents: [{
      role: 'user',
      parts: [{ text: buildUserPrompt(taskMetadata) }, ...inlineParts]
    }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    return buildFallbackProcessedResult({
      images,
      metadata: taskMetadata,
      requestId,
      startedAt,
      source: 'fallback',
      reason: `gemini_api_error_${response.status}`,
      error: text
    });
  }

  try {
    const parsed = normalizeJsonCandidate(text) || {};
    return normalizeProcessedResult({
      parsed,
      images,
      metadata: taskMetadata,
      requestId,
      startedAt,
      source: 'llm'
    });
  } catch (error) {
    return buildFallbackProcessedResult({
      images,
      metadata: taskMetadata,
      requestId,
      startedAt,
      source: 'fallback',
      reason: 'invalid_gemini_json',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

module.exports = { processImages };
