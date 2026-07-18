export interface OcrConfig {
  confidenceThreshold: number;
  maxRetries: number;
  enablePreprocessing: boolean;
  enableCloudFallback: boolean;
}

export interface GeminiConfig {
  apiKey: string | null;
  model: string;
  visionEnabled: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeout: number;
}

export interface PipelineConfig {
  ocr: OcrConfig;
  gemini: GeminiConfig;
  maxRetries: number;
}

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (!raw) return fallback;
  return raw === "true" || raw === "1";
}

export function getPipelineConfig(): PipelineConfig {
  return {
    ocr: {
      confidenceThreshold: envNumber("OCR_CONFIDENCE_THRESHOLD", 0.7),
      maxRetries: envNumber("OCR_MAX_RETRIES", 2),
      enablePreprocessing: envBool("OCR_ENABLE_PREPROCESSING", true),
      enableCloudFallback: envBool("OCR_ENABLE_CLOUD_FALLBACK", false),
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || null,
      model: process.env.GEMINI_MODEL || process.env.LLM_MODEL || "gemini-2.0-flash",
      visionEnabled: envBool("GEMINI_ENABLE_VISION", true),
      confidenceThreshold: envNumber("GEMINI_CONFIDENCE_THRESHOLD", 0.6),
      maxRetries: envNumber("GEMINI_MAX_RETRIES", 3),
      timeout: envNumber("GEMINI_TIMEOUT", 60000),
    },
    maxRetries: envNumber("PIPELINE_MAX_RETRIES", 2),
  };
}

export function validatePipelineConfig(): string[] {
  const config = getPipelineConfig();
  const warnings: string[] = [];

  if (!config.gemini.apiKey) {
    warnings.push("GEMINI_API_KEY not set — Gemini extraction will fall back to rule-based");
  }

  if (config.ocr.confidenceThreshold < 0 || config.ocr.confidenceThreshold > 1) {
    warnings.push("OCR_CONFIDENCE_THRESHOLD must be between 0 and 1, using default");
  }

  if (config.gemini.confidenceThreshold < 0 || config.gemini.confidenceThreshold > 1) {
    warnings.push("GEMINI_CONFIDENCE_THRESHOLD must be between 0 and 1, using default");
  }

  return warnings;
}
