import { getPipelineConfig } from "../config/pipeline";
import { runOcrWithRetry } from "./ocrPipeline";
import { executeFallbackChain } from "./geminiPipeline";
import { convertPdfToImages, isPdf } from "./pdfConversion";
import { emitPipelineTelemetry } from "./pipelineTelemetry";
import type { OcrPipelineResult } from "./ocrPipeline";
import type { FallbackChainResult } from "./geminiPipeline";

export interface PipelineStageTiming {
  preprocessing?: number;
  ocr?: number;
  gemini?: number;
  simplification?: number;
  total: number;
}

export interface DocumentPipelineResult {
  accepted: boolean;
  ocrConfidence: number;
  geminiConfidence: number;
  extractedData: Record<string, unknown>;
  plainLanguageSummary: string;
  urgency: string;
  recommendations: string[];
  warnings: string[];
  path: string;
  rejectionReason?: string;
  rejectionAdvice?: string;
  timing: PipelineStageTiming;
  pages?: number;
}

export interface PipelineInput {
  imageBase64: string;
  fileName?: string;
  language?: string;
  isPdf?: boolean;
  pdfBuffer?: Buffer;
}

const URGENCY_MAP: Record<string, string> = {
  HIGH: "HIGH",
  MODERATE: "MODERATE",
  LOW: "LOW",
};

function computeUrgency(tests: { flagged?: boolean }[]): string {
  const flagged = tests.filter((t) => t.flagged).length;
  if (flagged >= 3) return "HIGH";
  if (flagged >= 1) return "MODERATE";
  return "LOW";
}

function buildRecommendations(urgency: string, warnings: string[]): string[] {
  if (urgency === "HIGH") {
    return [
      "Seek medical attention promptly for flagged results",
      "Bring these results to your doctor for review",
      "Monitor symptoms and seek emergency care if worsening",
    ];
  }
  if (urgency === "MODERATE") {
    return [
      "Schedule a follow-up with your healthcare provider soon",
      "Discuss the flagged results with your doctor",
    ];
  }
  if (warnings.length > 0) {
    return ["Review these results at your next routine check-up"];
  }
  return ["Your results appear normal. Continue regular check-ups."];
}

export async function executeDocumentPipeline(
  input: PipelineInput,
): Promise<DocumentPipelineResult> {
  const startTime = Date.now();
  const config = getPipelineConfig();
  const warnings: string[] = [];
  const timing: PipelineStageTiming = { total: 0 };

  emitPipelineTelemetry("started", { requestId: input.fileName });

  let imageToProcess = input.imageBase64;

  if (input.isPdf && input.pdfBuffer) {
    const pdfStart = Date.now();
    const pdfResult = await convertPdfToImages(input.pdfBuffer);
    timing.preprocessing = Date.now() - pdfStart;

    if (!pdfResult.success) {
      return {
        accepted: false,
        ocrConfidence: 0,
        geminiConfidence: 0,
        extractedData: {},
        plainLanguageSummary: "",
        urgency: "MODERATE",
        recommendations: ["Please upload a valid PDF medical document"],
        warnings: [pdfResult.error || "PDF conversion failed"],
        path: "pdf_conversion_failed",
        rejectionReason: "pdf_conversion_failed",
        rejectionAdvice: "The PDF could not be processed. Please try uploading the document as an image (PNG or JPG).",
        timing: { ...timing, total: Date.now() - startTime },
        pages: 0,
      };
    }

    imageToProcess = pdfResult.pages[0]?.base64 || input.imageBase64;
  }

  const ocrStart = Date.now();
  const ocrResult: OcrPipelineResult = await runOcrWithRetry(imageToProcess);
  timing.ocr = Date.now() - ocrStart;

  emitPipelineTelemetry("ocr.completed", {
    ocrConfidence: ocrResult.confidence,
    accepted: ocrResult.accepted,
    processingTimeMs: timing.ocr,
  });

  if (!ocrResult.accepted) {
    return {
      accepted: false,
      ocrConfidence: ocrResult.confidence,
      geminiConfidence: 0,
      extractedData: {},
      plainLanguageSummary: "",
      urgency: "MODERATE",
      recommendations: ["Please retake the photo with better lighting and ensure the document is flat"],
      warnings: ocrResult.warnings,
      path: "ocr_rejected",
      rejectionReason: ocrResult.rejectionReason,
      rejectionAdvice: ocrResult.rejectionAdvice,
      timing: { ...timing, total: Date.now() - startTime },
    };
  }

  warnings.push(...ocrResult.warnings);

  if (ocrResult.pages.length > 1) {
    const confidences = ocrResult.pages.map((p) => p.confidence);
    const minC = Math.min(...confidences);
    const maxC = Math.max(...confidences);
    if (maxC - minC > 0.3) {
      warnings.push(
        `Confidence varies significantly across pages (low: ${Math.round(minC * 100)}%, high: ${Math.round(maxC * 100)}%)`,
      );
    }
    const lowPages = ocrResult.pages
      .filter((p) => p.confidence < 0.6)
      .map((p) => `page ${p.pageNumber}`);
    if (lowPages.length > 0) {
      warnings.push(`Low clarity on ${lowPages.join(", ")} — results may be less accurate for those pages`);
    }
  }

  const geminiStart = Date.now();
  const geminiResult: FallbackChainResult = await executeFallbackChain(
    imageToProcess,
    ocrResult.text,
    input.language || "en",
  );
  timing.gemini = Date.now() - geminiStart;

  emitPipelineTelemetry("gemini.completed", {
    geminiConfidence: geminiResult.confidence,
    path: geminiResult.path,
    processingTimeMs: timing.gemini,
  });

  warnings.push(...geminiResult.warnings);
  const urgency = computeUrgency(geminiResult.extractedData.tests);
  const recommendations = buildRecommendations(urgency, warnings);

  timing.total = Date.now() - startTime;

  emitPipelineTelemetry("completed", {
    ocrConfidence: ocrResult.confidence,
    geminiConfidence: geminiResult.confidence,
    path: geminiResult.path,
    accepted: true,
    processingTimeMs: timing.total,
  });

  return {
    accepted: true,
    ocrConfidence: ocrResult.confidence,
    geminiConfidence: geminiResult.confidence,
    extractedData: geminiResult.extractedData as unknown as Record<string, unknown>,
    plainLanguageSummary: geminiResult.simplification.summary,
    urgency,
    recommendations,
    warnings,
    path: geminiResult.path,
    timing,
  };
}
