/**
 * AI Document Workflow Service
 * Orchestrates the complete pipeline: Upload → OCR → Extraction → Analysis → Plain Language
 */

import type { Dialect, Severity } from "@klaro/validators/llm";

import { extractTestsFromText } from "./extraction";
import { generatePlainLanguageExplanation } from "./llm";
import { performOcrWithFallback } from "./ocr";

/** Local extracted test type with guaranteed flagged boolean */
interface ExtractedTestResult {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged: boolean;
}

export interface WorkflowConfig {
  /** Enable Gemini Vision for complex documents */
  useGeminiVision: boolean;
  /** OCR confidence threshold for cloud fallback */
  ocrThreshold: number;
  /** Preferred output dialect */
  dialect: Dialect;
  /** Process images in parallel */
  parallelProcessing: boolean;
}

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  useGeminiVision: true,
  ocrThreshold: 0.7,
  dialect: "Filipino",
  parallelProcessing: true,
};

export interface WorkflowResult {
  requestId: string;
  status: "pending" | "processing" | "completed" | "error";
  /** OCR extracted text */
  ocrText: string;
  /** OCR confidence score */
  ocrConfidence: number;
  /** Extracted test results */
  extractedTests: ExtractedTestResult[];
  /** Flagged (abnormal) tests - tests where flagged === true */
  flaggedTests: ExtractedTestResult[];
  /** Plain language explanation */
  plainLanguage: {
    summary: string;
    tests: Array<{
      name: string;
      value?: string;
      interpretation: string;
      recommendation?: string;
    }>;
    severity: Severity;
    disclaimer?: string;
    bookingCta?: string;
  };
  /** Tanong Mo Sa Doktor card */
  tanqmoCard: {
    title: string;
    questions: string[];
    severity: Severity;
    disclaimer?: string;
    bookingCta?: string;
  };
  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    ocrSource: "local" | "cloud";
    usedFallback: boolean;
    imageCount: number;
  };
  /** Any warnings during processing */
  warnings: string[];
}

export interface WorkflowError {
  code: string;
  message: string;
  stage: "upload" | "ocr" | "extraction" | "analysis" | "language";
  recoverable: boolean;
}

/**
 * Execute the complete AI document workflow
 * Processes images/PDFs through OCR → Extraction → Analysis → Plain Language
 */
export async function executeDocumentWorkflow(
  images: Array<{ buffer: Buffer; filename: string; mimeType?: string }>,
  config: Partial<WorkflowConfig> = {},
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_WORKFLOW_CONFIG, ...config };
  const requestId = `workflow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const warnings: string[] = [];

  try {
    // Stage 1: OCR Processing
    const ocrResults = await processOCR(images, fullConfig, warnings);

    // Stage 2: Extract test data
    const rawExtractedTests = extractTestsFromText(ocrResults.combinedText);
    const extractedTests: ExtractedTestResult[] = rawExtractedTests.map(
      (t) => ({
        name: t.name,
        value: t.value,
        unit: t.unit,
        referenceRange: t.referenceRange,
        flagged: t.flagged === true,
      }),
    );
    const flaggedTests = extractedTests.filter((t) => t.flagged);

    // Stage 3: Generate plain language explanation
    // Map to the type expected by LLM service
    const llmTests = extractedTests.map((t) => ({
      name: t.name,
      value: t.value,
      unit: t.unit,
      referenceRange: t.referenceRange,
      flagged: t.flagged,
    }));
    const plainLanguage = generatePlainLanguageExplanation(
      llmTests,
      fullConfig.dialect,
    );

    // Stage 4: Build Tanong Mo Sa Doktor card
    const tanqmoCard = {
      title:
        fullConfig.dialect === "Filipino"
          ? "Itatanong Mo Sa Doktor"
          : fullConfig.dialect === "Bisaya"
            ? "Pangutanon Para Sa Doktor"
            : fullConfig.dialect === "Ilocano"
              ? "Itatanong Mo Kadagiti Doktor"
              : "Questions For Your Doctor",
      questions: plainLanguage.questionsForDoctor.slice(0, 5),
      severity: plainLanguage.severity,
      disclaimer: plainLanguage.disclaimer,
      bookingCta: plainLanguage.bookingPrompt,
    };

    return {
      requestId,
      status: "completed",
      ocrText: ocrResults.combinedText,
      ocrConfidence: ocrResults.confidence,
      extractedTests,
      flaggedTests,
      plainLanguage: {
        summary: plainLanguage.summary,
        tests: plainLanguage.tests,
        severity: plainLanguage.severity,
        disclaimer: plainLanguage.disclaimer,
        bookingCta: plainLanguage.bookingPrompt,
      },
      tanqmoCard,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        ocrSource: ocrResults.source,
        usedFallback: ocrResults.usedFallback,
        imageCount: images.length,
      },
      warnings,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown workflow error";

    return {
      requestId,
      status: "error",
      ocrText: "",
      ocrConfidence: 0,
      extractedTests: [],
      flaggedTests: [],
      plainLanguage: {
        summary: "Failed to process document. Please try again.",
        tests: [],
        severity: "MODERATE",
        disclaimer:
          "Unable to process document. Please consult a healthcare provider.",
      },
      tanqmoCard: {
        title: "Itatanong Mo Sa Doktor",
        questions: [],
        severity: "MODERATE",
      },
      metadata: {
        processingTimeMs: Date.now() - startTime,
        ocrSource: "local",
        usedFallback: false,
        imageCount: images.length,
      },
      warnings: [errorMessage],
    };
  }
}

/**
 * Process OCR for multiple images with fallback
 */
async function processOCR(
  images: Array<{ buffer: Buffer; filename: string; mimeType?: string }>,
  config: WorkflowConfig,
  warnings: string[],
): Promise<{
  combinedText: string;
  confidence: number;
  source: "local" | "cloud";
  usedFallback: boolean;
}> {
  const ocrResults = await Promise.all(
    images.map(async (image) => {
      try {
        const { result, audit } = await performOcrWithFallback(image.buffer, {
          threshold: config.ocrThreshold,
        });

        if (audit.usedCloudFallback) {
          warnings.push(`Cloud OCR used for ${image.filename}`);
        }

        return {
          text: result.text,
          confidence: result.confidence,
          source: result.source,
        };
      } catch (error) {
        warnings.push(`OCR failed for ${image.filename}: ${error}`);
        return {
          text: "",
          confidence: 0,
          source: "local" as const,
        };
      }
    }),
  );

  // Combine all OCR results
  const combinedText = ocrResults.map((r) => r.text).join("\n\n");
  const avgConfidence =
    ocrResults.reduce((sum, r) => sum + r.confidence, 0) / ocrResults.length;
  const usedFallback = ocrResults.some((r) => r.source === "cloud");

  return {
    combinedText,
    confidence: avgConfidence,
    source: usedFallback ? "cloud" : "local",
    usedFallback,
  };
}

/**
 * Simplified workflow for guest users (no authentication required)
 */
export async function executeGuestWorkflow(
  base64Images: Array<{ bytesBase64: string; filename: string }>,
  options: {
    language?: "Filipino" | "English" | "Bisaya" | "Ilocano";
    patientAge?: number;
    patientSex?: "male" | "female" | "other";
  } = {},
): Promise<WorkflowResult> {
  // Convert base64 to buffers
  const images = base64Images.map((img) => ({
    buffer: Buffer.from(img.bytesBase64, "base64"),
    filename: img.filename,
    mimeType: guessMimeType(img.filename),
  }));

  const dialect: Dialect = (options.language as Dialect) || "Filipino";

  return executeDocumentWorkflow(images, {
    dialect,
    useGeminiVision: true,
    ocrThreshold: 0.7,
  });
}

/**
 * Guess MIME type from filename
 */
function guessMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

/**
 * Validate workflow input
 */
export function validateWorkflowInput(
  images: Array<{ buffer?: Buffer; filename: string; mimeType?: string }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!images || images.length === 0) {
    errors.push("At least one image is required");
  }

  if (images.length > 20) {
    errors.push("Maximum 20 images allowed per workflow");
  }

  for (const image of images) {
    if (!image.filename) {
      errors.push("Filename is required for all images");
    }
    if (image.buffer && image.buffer.length > 50 * 1024 * 1024) {
      errors.push(`File ${image.filename} exceeds 50MB limit`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get workflow status for a given request ID
 * (In production, this would query a job queue or database)
 */
export function getWorkflowStatus(
  _requestId: string,
): { status: string; progress?: number } {
  // Placeholder - in production, query job queue
  return {
    status: "completed",
    progress: 100,
  };
}
