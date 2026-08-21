import type { FallbackChainResult } from "./geminiPipeline";
import type { OcrPipelineResult } from "./ocrPipeline";
import { executeFallbackChain } from "./geminiPipeline";
import { runOcrWithRetry } from "./ocrPipeline";
import { convertPdfToImages } from "./pdfConversion";
import { emitPipelineTelemetry } from "./pipelineTelemetry";

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
  const warnings: string[] = [];
  const timing: PipelineStageTiming = { total: 0 };

  void emitPipelineTelemetry("started", { requestId: input.fileName });

  let imageToProcess = input.imageBase64;

  // Defensive file validation preflight for PDF buffers (encrypted/corrupt without crash)
  if (input.isPdf && input.pdfBuffer) {
    try {
      const { validateFileBuffer } = await import("./fileValidation");
      const validation = await validateFileBuffer(input.pdfBuffer, "application/pdf", input.fileName);
      if (!validation.valid) {
        const advice = validation.sanitizedError ?? "PDF could not be processed. Please try with a valid unprotected file.";
        const isEncrypted = advice.toLowerCase().includes("password") || advice.toLowerCase().includes("encrypted");
        return {
          accepted: false,
          ocrConfidence: 0,
          geminiConfidence: 0,
          extractedData: {},
          plainLanguageSummary: "",
          urgency: "MODERATE",
          recommendations: ["Please upload a valid PDF medical document"],
          warnings: [validation.rawError || advice],
          path: isEncrypted ? "pdf_encrypted" : "pdf_validation_failed",
          rejectionReason: isEncrypted ? "pdf_encrypted" : "pdf_validation_failed",
          rejectionAdvice: advice,
          timing: { ...timing, total: Date.now() - startTime },
          pages: 0,
        };
      }
    } catch {
      // never fail validation preflight
    }

    const pdfStart = Date.now();
    let pdfResult;
    try {
      pdfResult = await convertPdfToImages(input.pdfBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF conversion crashed";
      console.warn(`[documentPipeline] convertPdfToImages crashed: ${msg.slice(0, 80)}`);
      return {
        accepted: false,
        ocrConfidence: 0,
        geminiConfidence: 0,
        extractedData: {},
        plainLanguageSummary: "",
        urgency: "MODERATE",
        recommendations: ["Please upload a valid PDF medical document"],
        warnings: [`pdf_crash:${msg.slice(0, 40)}`],
        path: "pdf_conversion_crashed",
        rejectionReason: "pdf_conversion_crashed",
        rejectionAdvice: "PDF processing encountered an error. Your file was not corrupted - please retry or try uploading as an image.",
        timing: { ...timing, total: Date.now() - startTime },
        pages: 0,
      };
    }
    timing.preprocessing = Date.now() - pdfStart;

    if (!pdfResult.success) {
      const raw = pdfResult.error || "PDF conversion failed";
      const lower = raw.toLowerCase();
      const isEncrypted = lower.includes("password") || lower.includes("encrypted");
      const advice = isEncrypted
        ? "This PDF is password-protected or encrypted and cannot be processed. Please provide an unprotected file."
        : lower.includes("corrupt") || lower.includes("invalid")
          ? "This PDF appears corrupted or invalid. Please try re-exporting the original document."
          : "The PDF could not be processed. Please try uploading the document as an image (PNG or JPG).";
      return {
        accepted: false,
        ocrConfidence: 0,
        geminiConfidence: 0,
        extractedData: {},
        plainLanguageSummary: "",
        urgency: "MODERATE",
        recommendations: ["Please upload a valid PDF medical document"],
        warnings: [raw],
        path: isEncrypted ? "pdf_encrypted" : "pdf_conversion_failed",
        rejectionReason: isEncrypted ? "pdf_encrypted" : "pdf_conversion_failed",
        rejectionAdvice: advice,
        timing: { ...timing, total: Date.now() - startTime },
        pages: 0,
      };
    }

    imageToProcess = pdfResult.pages[0]?.base64 || input.imageBase64;
  }

  try {
    const ocrStart = Date.now();
  const ocrResult: OcrPipelineResult = await runOcrWithRetry(imageToProcess);
  timing.ocr = Date.now() - ocrStart;

  void emitPipelineTelemetry("ocr.completed", {
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
      recommendations: [
        "Please retake the photo with better lighting and ensure the document is flat",
      ],
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
      warnings.push(
        `Low clarity on ${lowPages.join(", ")} — results may be less accurate for those pages`,
      );
    }
  }

  const geminiStart = Date.now();
  const geminiResult: FallbackChainResult = await executeFallbackChain(
    imageToProcess,
    ocrResult.text,
    input.language || "en",
  );
  timing.gemini = Date.now() - geminiStart;

  void emitPipelineTelemetry("gemini.completed", {
    geminiConfidence: geminiResult.confidence,
    path: geminiResult.path,
    processingTimeMs: timing.gemini,
  });

  warnings.push(...geminiResult.warnings);
  const urgency = computeUrgency(geminiResult.extractedData.tests);
  const recommendations = buildRecommendations(urgency, warnings);

  timing.total = Date.now() - startTime;

  void emitPipelineTelemetry("completed", {
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
      extractedData: geminiResult.extractedData as unknown as Record<
        string,
        unknown
      >,
      plainLanguageSummary: geminiResult.simplification.summary,
      urgency,
      recommendations,
      warnings,
      path: geminiResult.path,
      timing,
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Pipeline crashed";
    console.warn(`[documentPipeline] top-level crash sanitized: ${raw.slice(0, 80)}`);
    return {
      accepted: false,
      ocrConfidence: 0,
      geminiConfidence: 0,
      extractedData: {},
      plainLanguageSummary: "",
      urgency: "MODERATE",
      recommendations: ["Please try again with a clearer file. If the issue persists, contact support."],
      warnings: [`pipeline_crash:${raw.slice(0, 40)}`],
      path: "pipeline_crashed",
      rejectionReason: "pipeline_crashed",
      rejectionAdvice: "We encountered an error processing your document, but no data was lost. Please retry or try uploading as an image.",
      timing: { ...timing, total: Date.now() - startTime },
    };
  }
}
