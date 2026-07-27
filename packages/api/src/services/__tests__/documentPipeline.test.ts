import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MedicalExtractionData } from "../geminiExtraction";
import type { FallbackChainResult } from "../geminiPipeline";
import type { SimplificationResult } from "../geminiSimplification";
import type { OcrPipelineResult } from "../ocrPipeline";
import { executeDocumentPipeline } from "../documentPipeline";
import { executeFallbackChain } from "../geminiPipeline";
import { runOcrWithRetry } from "../ocrPipeline";

vi.mock("../ocrPipeline", () => ({
  runOcrWithRetry: vi.fn(),
}));

vi.mock("../geminiPipeline", () => ({
  executeFallbackChain: vi.fn(),
}));

vi.mock("../pdfConversion", () => ({
  convertPdfToImages: vi.fn(),
  isPdf: vi.fn(),
}));

vi.mock("../pipelineTelemetry", () => ({
  emitPipelineTelemetry: vi.fn(),
}));

function makeOcrResult(
  overrides: Partial<OcrPipelineResult> = {},
): OcrPipelineResult {
  const defaults = {
    success: true,
    accepted: true,
    text: "Glucose: 95 mg/dL\nCholesterol: 180 mg/dL",
    confidence: 0.85,
    pages: [
      {
        pageNumber: 1,
        text: "test",
        confidence: 0.85,
        source: "local",
        warnings: [],
      },
    ],
    source: "local",
    warnings: [],
    processingTimeMs: 100,
  };
  return {
    ...defaults,
    ...overrides,
    rejectionAdvice:
      overrides.accepted === false && overrides.rejectionAdvice === undefined
        ? "The document appears too blurry or unclear."
        : overrides.rejectionAdvice,
  } as OcrPipelineResult;
}

function makeGeminiResult(
  overrides: Partial<FallbackChainResult> = {},
): FallbackChainResult {
  return {
    extractedData: {
      patientName: "Juan Dela Cruz",
      date: "2025-01-15",
      tests: [
        {
          name: "Glucose",
          value: "95",
          unit: "mg/dL",
          referenceRange: "70-110",
          flagged: false,
        },
        {
          name: "Cholesterol",
          value: "180",
          unit: "mg/dL",
          referenceRange: "120-200",
          flagged: false,
        },
      ],
      diagnosis: [],
      medications: [],
    },
    path: "ocr_extraction",
    confidence: 0.85,
    simplification: {
      summary: "Your test results appear normal.",
      dialect: "English",
      readingLevel: "grade5",
      success: true,
    },
    processingTimeMs: 200,
    warnings: [],
    ...overrides,
  };
}

describe("executeDocumentPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a clear document and returns full analysis", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(makeOcrResult());
    vi.mocked(executeFallbackChain).mockResolvedValue(makeGeminiResult());

    const result = await executeDocumentPipeline({
      imageBase64: "dGVzdA==",
      fileName: "test.png",
      language: "en",
    });

    expect(result.accepted).toBe(true);
    expect(result.ocrConfidence).toBe(0.85);
    expect(result.geminiConfidence).toBe(0.85);
    expect(result.path).toBe("ocr_extraction");
    expect(result.plainLanguageSummary).toBe(
      "Your test results appear normal.",
    );
    expect(result.warnings).toHaveLength(0);
    expect(result.timing.total).toBeGreaterThanOrEqual(0);
  });

  it("rejects a blurry document with advice", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(
      makeOcrResult({
        accepted: false,
        confidence: 0.3,
        rejectionReason: "low_confidence",
      }),
    );

    const result = await executeDocumentPipeline({
      imageBase64: "Ymx1cnJ5",
      fileName: "blurry.png",
      language: "en",
    });

    expect(result.accepted).toBe(false);
    expect(result.ocrConfidence).toBe(0.3);
    expect(result.rejectionReason).toBe("low_confidence");
    expect(result.rejectionAdvice).toBeTruthy();
    expect(result.path).toBe("ocr_rejected");
    expect(executeFallbackChain).not.toHaveBeenCalled();
  });

  it("handles OCR with warnings (mixed confidence)", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(
      makeOcrResult({
        warnings: ["Retry 1/2: confidence 0.55 below threshold 0.7"],
      }),
    );
    vi.mocked(executeFallbackChain).mockResolvedValue(makeGeminiResult());

    const result = await executeDocumentPipeline({
      imageBase64: "bWl4ZWQ=",
      fileName: "mixed.png",
      language: "en",
    });

    expect(result.accepted).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it("returns rule-based fallback when Gemini fails", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(makeOcrResult());
    vi.mocked(executeFallbackChain).mockResolvedValue(
      makeGeminiResult({
        path: "rule_based",
        confidence: 0.5,
        warnings: ["rule_based:used"],
      }),
    );

    const result = await executeDocumentPipeline({
      imageBase64: "dGVzdA==",
      fileName: "gemini-down.png",
      language: "en",
    });

    expect(result.accepted).toBe(true);
    expect(result.path).toBe("rule_based");
    expect(result.geminiConfidence).toBe(0.5);
  });

  it("rejects empty or bad input gracefully", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(
      makeOcrResult({
        success: false,
        accepted: false,
        text: "",
        confidence: 0,
      }),
    );

    const result = await executeDocumentPipeline({
      imageBase64: "",
      fileName: "empty.png",
      language: "en",
    });

    expect(result.accepted).toBe(false);
  });

  it("computes HIGH urgency for 3+ flagged tests", async () => {
    vi.mocked(runOcrWithRetry).mockResolvedValue(makeOcrResult());
    vi.mocked(executeFallbackChain).mockResolvedValue(
      makeGeminiResult({
        extractedData: {
          tests: [
            {
              name: "WBC",
              value: "15",
              unit: "x10^3/uL",
              referenceRange: "4-10",
              flagged: true,
            },
            {
              name: "Glucose",
              value: "200",
              unit: "mg/dL",
              referenceRange: "70-110",
              flagged: true,
            },
            {
              name: "ALT",
              value: "80",
              unit: "U/L",
              referenceRange: "10-40",
              flagged: true,
            },
          ],
        },
      }),
    );

    const result = await executeDocumentPipeline({
      imageBase64: "dGVzdA==",
      fileName: "urgent.png",
      language: "en",
    });

    expect(result.urgency).toBe("HIGH");
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
