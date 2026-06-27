export interface GeminiExtractionResult {
  success: boolean;
  data?: Record<string, unknown>;
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
): string {
  const langInstruction = language && language !== "en"
    ? `Respond in ${language}.`
    : "";

  return `Extract structured medical data from the following OCR text.

${langInstruction}

OCR TEXT:
${ocrText}

Return JSON with these fields:
- patientName: string
- dateOfBirth: string (YYYY-MM-DD)
- gender: string
- address: string
- phoneNumber: string
- email: string
- emergencyContact: { name: string, relationship: string, phone: string }
- insuranceProvider: string
- policyNumber: string
- diagnosis: string[]
- medications: { name: string, dosage: string, frequency: string }[]
- allergies: string[]
- labResults: { testName: string, value: string, unit: string, referenceRange: string }[]
- vitalSigns: { type: string, value: string, unit: string }[]
- medicalHistory: string[]
- notes: string`;
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

export function calculateExtractionConfidence(
  data: Record<string, unknown>,
): number {
  const requiredFields = [
    "patientName",
    "dateOfBirth",
    "gender",
    "address",
    "insuranceProvider",
    "policyNumber",
  ];

  const optionalFields = [
    "phoneNumber",
    "email",
    "emergencyContact",
    "diagnosis",
    "medications",
    "allergies",
    "labResults",
    "vitalSigns",
    "medicalHistory",
    "notes",
  ];

  let score = 0;
  let total = 0;

  for (const field of requiredFields) {
    total += 2;
    if (data[field] !== undefined && data[field] !== null && data[field] !== "") {
      score += 2;
    }
  }

  for (const field of optionalFields) {
    total += 1;
    if (data[field] !== undefined && data[field] !== null) {
      if (Array.isArray(data[field]) && (data[field] as unknown[]).length > 0) {
        score += 1;
      } else if (typeof data[field] === "object" && data[field] !== null) {
        score += 1;
      } else if (typeof data[field] === "string" && (data[field] as string).length > 0) {
        score += 1;
      }
    }
  }

  return total > 0 ? Math.round((score / total) * 100) / 100 : 0;
}

export function validateExtractionData(
  data: Record<string, unknown>,
): string[] {
  const errors: string[] = [];

  if (!data.patientName || typeof data.patientName !== "string") {
    errors.push("patientName is required and must be a string");
  }

  if (!data.dateOfBirth || typeof data.dateOfBirth !== "string") {
    errors.push("dateOfBirth is required and must be a string (YYYY-MM-DD)");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth as string)) {
    errors.push("dateOfBirth must be in YYYY-MM-DD format");
  }

  if (!data.gender || typeof data.gender !== "string") {
    errors.push("gender is required and must be a string");
  }

  if (data.diagnosis && !Array.isArray(data.diagnosis)) {
    errors.push("diagnosis must be an array");
  }

  if (data.medications && !Array.isArray(data.medications)) {
    errors.push("medications must be an array");
  }

  if (data.allergies && !Array.isArray(data.allergies)) {
    errors.push("allergies must be an array");
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

  return `Extraction successful${confidence} using ${result.model || "unknown model"}`;
}
