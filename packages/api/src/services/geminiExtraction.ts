export interface ExtractedTest {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
}

export interface ExtractedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface MedicalExtractionData {
  patientName?: string;
  date?: string;
  documentType?: string;
  tests: ExtractedTest[];
  diagnosis: string[];
  medications: ExtractedMedication[];
}

export interface GeminiExtractionResult {
  success: boolean;
  data?: MedicalExtractionData;
  rawResponse?: string;
  confidence?: number;
  model?: string;
  error?: string;
}

export interface GeminiExtractionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
}

export function getExtractionPromptDefaults(): GeminiExtractionOptions {
  return {
    model: "gemini-2.5-flash",
    temperature: 0.1,
    maxTokens: 4096,
    language: "en",
  };
}

export function buildExtractionPrompt(
  ocrText: string,
  language?: string,
  documentType?: string,
): string {
  const langInstruction = language && language !== "en"
    ? `Respond in ${language}.`
    : "";

  const typeHint = documentType
    ? `This document appears to be a: ${documentType}.`
    : "";

  return `Extract structured medical data from the following OCR text.

${langInstruction}
${typeHint}

OCR TEXT:
${ocrText}

Return ONLY valid JSON with this exact structure:
{
  "patientName": string or null,
  "date": string or null (document date),
  "documentType": string or null,
  "tests": [
    {
      "name": string (test name),
      "value": string (numeric result),
      "unit": string or null (measurement unit),
      "referenceRange": string or null (normal range),
      "flagged": boolean (true if outside normal range)
    }
  ],
  "diagnosis": string[],
  "medications": [
    {
      "name": string,
      "dosage": string or null,
      "frequency": string or null
    }
  ]
}

If a field has no data, use null or empty array. Return ONLY the JSON object, no other text.`;
}

export function parseGeminiResponse(response: string): Record<string, unknown> | null {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export function normalizeExtractionData(
  raw: Record<string, unknown>,
): MedicalExtractionData {
  const tests = (raw.tests as unknown[])?.filter(Array.isArray) ?? [];
  const medications = (raw.medications as unknown[])?.filter(Array.isArray) ?? [];

  return {
    patientName: typeof raw.patientName === "string" ? raw.patientName : undefined,
    date: typeof raw.date === "string" ? raw.date : undefined,
    documentType: typeof raw.documentType === "string" ? raw.documentType : undefined,
    tests: (raw.tests as ExtractedTest[])?.filter((t) => t && typeof t.name === "string") ?? [],
    diagnosis: Array.isArray(raw.diagnosis)
      ? raw.diagnosis.filter((d): d is string => typeof d === "string")
      : [],
    medications: (raw.medications as ExtractedMedication[])?.filter((m) => m && typeof m.name === "string") ?? [],
  };
}

export function calculateExtractionConfidence(
  data: MedicalExtractionData,
): number {
  let score = 0;
  let total = 6;

  if (data.patientName) score += 1;
  if (data.date) score += 1;
  if (data.documentType) score += 1;
  if (data.diagnosis.length > 0) score += 1;
  if (data.medications.length > 0) score += 1;
  if (data.tests.length > 0) score += 2;

  total += data.tests.length;
  for (const test of data.tests) {
    if (test.value) score += 1;
    if (test.unit) score += 0.5;
    if (test.referenceRange) score += 0.5;
  }

  return total > 0 ? Math.min(1, Math.round((score / total) * 100) / 100) : 0;
}

export function validateExtractionData(
  data: MedicalExtractionData,
): string[] {
  const errors: string[] = [];

  if (data.tests && !Array.isArray(data.tests)) {
    errors.push("tests must be an array");
  }

  if (data.diagnosis && !Array.isArray(data.diagnosis)) {
    errors.push("diagnosis must be an array");
  }

  if (data.medications && !Array.isArray(data.medications)) {
    errors.push("medications must be an array");
  }

  for (const test of data.tests) {
    if (!test.name) {
      errors.push("each test must have a name");
    }
  }

  return errors;
}

export function formatExtractionResult(
  result: GeminiExtractionResult,
): string {
  if (!result.success) {
    return `Extraction failed: ${result.error}`;
  }

  const confidence = result.confidence
    ? ` (${(result.confidence * 100).toFixed(1)}% confidence)`
    : "";

  const testCount = result.data?.tests?.length ?? 0;
  const diagnosisCount = result.data?.diagnosis?.length ?? 0;

  return `Extraction successful${confidence}: ${testCount} tests, ${diagnosisCount} diagnoses using ${result.model || "unknown model"}`;
}

export function isLowConfidence(confidence: number, threshold = 0.6): boolean {
  return confidence < threshold;
}
