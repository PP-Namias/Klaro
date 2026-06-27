import { normalizeOcrResult, type NormalizedOcrResult } from "./ocrResult";
import { geminiFallback, type FallbackResult } from "./geminiFallback";

export interface PipelineConfig {
  enableOcr: boolean;
  enableGemini: boolean;
  enableFallback: boolean;
  language?: string;
}

export interface PipelineResult {
  ocrResult?: NormalizedOcrResult;
  extractedData?: Record<string, unknown>;
  plainLanguage?: string;
  isMock: boolean;
  processingTimeMs: number;
  stages: {
    ocr: { status: string; timeMs: number };
    extraction: { status: string; timeMs: number };
    plainLanguage: { status: string; timeMs: number };
  };
}

export function getPipelineConfig(): PipelineConfig {
  return {
    enableOcr: process.env.PIPELINE_ENABLE_OCR !== "false",
    enableGemini: process.env.PIPELINE_ENABLE_GEMINI !== "false",
    enableFallback: process.env.PIPELINE_ENABLE_FALLBACK !== "false",
    language: process.env.PIPELINE_LANGUAGE || "en",
  };
}

export async function executeOcrStage(
  imageInput: string | Buffer,
): Promise<{ result: NormalizedOcrResult; timeMs: number }> {
  const startTime = Date.now();

  try {
    const { performOcr } = await import("./ocr");
    const ocrResult = await performOcr(imageInput);

    const normalized = normalizeOcrResult(
      ocrResult.text,
      ocrResult.blocks,
      ocrResult.source,
    );

    return {
      result: normalized,
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      result: normalizeOcrResult("", []),
      timeMs: Date.now() - startTime,
    };
  }
}

export async function executeExtractionStage(
  imageBase64: string,
  ocrText?: string,
): Promise<{ data: Record<string, unknown>; isMock: boolean; timeMs: number }> {
  const startTime = Date.now();

  try {
    const { callGeminiVision } = await import("./geminiVision");
    const result = await callGeminiVision(imageBase64);

    return {
      data: result.structuredData || {},
      isMock: false,
      timeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const config = getPipelineConfig();

    if (config.enableFallback) {
      const fallbackResult = await geminiFallback(imageBase64);
      return {
        data: fallbackResult.data,
        isMock: true,
        timeMs: Date.now() - startTime,
      };
    }

    return {
      data: {},
      isMock: false,
      timeMs: Date.now() - startTime,
    };
  }
}

export async function executePlainLanguageStage(
  extractedData: Record<string, unknown>,
  language: string = "en",
): Promise<{ text: string; timeMs: number }> {
  const startTime = Date.now();

  try {
    const { generatePlainLanguageSummary } = await import("./plainLanguage");
    const result = generatePlainLanguageSummary(extractedData, { language });

    return {
      text: result.plainText,
      timeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      text: formatBasicSummary(extractedData),
      timeMs: Date.now() - startTime,
    };
  }
}

function formatBasicSummary(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.patientName) {
    parts.push(`Patient: ${data.patientName}`);
  }
  if (Array.isArray(data.diagnosis) && data.diagnosis.length > 0) {
    parts.push(`Diagnosis: ${(data.diagnosis as string[]).join(", ")}`);
  }
  if (Array.isArray(data.medications) && data.medications.length > 0) {
    const meds = data.medications as Array<{ name: string; dosage: string }>;
    parts.push(`Medications: ${meds.map((m) => `${m.name} ${m.dosage}`).join(", ")}`);
  }

  return parts.join("\n") || "No data extracted.";
}

export async function executePipeline(
  imageInput: string | Buffer,
  imageBase64: string,
  config: PipelineConfig = getPipelineConfig(),
): Promise<PipelineResult> {
  const totalStartTime = Date.now();

  const stages = {
    ocr: { status: "pending", timeMs: 0 },
    extraction: { status: "pending", timeMs: 0 },
    plainLanguage: { status: "pending", timeMs: 0 },
  };

  let ocrResult: NormalizedOcrResult | undefined;
  let extractedData: Record<string, unknown> = {};
  let isMock = false;

  if (config.enableOcr) {
    stages.ocr.status = "running";
    const ocrStage = await executeOcrStage(imageInput);
    ocrResult = ocrStage.result;
    stages.ocr.timeMs = ocrStage.timeMs;
    stages.ocr.status = "completed";
  }

  if (config.enableGemini) {
    stages.extraction.status = "running";
    const extractionStage = await executeExtractionStage(
      imageBase64,
      ocrResult?.normalizedText,
    );
    extractedData = extractionStage.data;
    isMock = extractionStage.isMock;
    stages.extraction.timeMs = extractionStage.timeMs;
    stages.extraction.status = "completed";
  }

  stages.plainLanguage.status = "running";
  const plainLanguageStage = await executePlainLanguageStage(
    extractedData,
    config.language,
  );
  stages.plainLanguage.timeMs = plainLanguageStage.timeMs;
  stages.plainLanguage.status = "completed";

  return {
    ocrResult,
    extractedData,
    plainLanguage: plainLanguageStage.text,
    isMock,
    processingTimeMs: Date.now() - totalStartTime,
    stages,
  };
}
