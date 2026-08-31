import { beforeEach, describe, expect, it, vi } from "vitest";

import { preprocessImage } from "../imagePreprocessor";
import { performOcr } from "../ocr";
import { buildRejectionResponse, runOcrWithRetry } from "../ocrPipeline";

vi.mock("../ocr", () => ({
  performOcr: vi.fn(),
}));

vi.mock("../imagePreprocessor", () => ({
  preprocessImage: vi.fn(),
  getDefaultPreprocessingOptions: vi.fn(() => ({})),
}));

describe("runOcrWithRetry — threshold gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(preprocessImage).mockResolvedValue({
      base64: "cHJvY2Vzc2Vk",
      width: 100,
      height: 100,
    });
  });

  it("accepts on first try when confidence >= 0.7", async () => {
    vi.mocked(performOcr).mockResolvedValue({
      text: "Glucose: 95 mg/dL",
      confidence: 0.85,
      source: "local",
      processingTimeMs: 50,
      warnings: [],
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(true);
    expect(result.confidence).toBe(0.85);
    expect(result.rejectionReason).toBeUndefined();
    expect(performOcr).toHaveBeenCalledTimes(1);
    // The first pass is preprocessed too; retries add further calls.
    expect(preprocessImage).toHaveBeenCalledTimes(1);
  });

  it("accepts on second try when retry crosses threshold (0.55 → 0.72)", async () => {
    let callCount = 0;
    vi.mocked(performOcr).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          text: "Glucose: 95",
          confidence: 0.55,
          source: "local",
          processingTimeMs: 50,
          warnings: [],
        };
      }
      return {
        text: "Glucose: 95 mg/dL",
        confidence: 0.72,
        source: "local",
        processingTimeMs: 50,
        warnings: [],
      };
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(performOcr).toHaveBeenCalledTimes(2);
    // One first-pass preprocess plus one for the single retry.
    // One first-pass preprocess plus one per exhausted retry.
    expect(preprocessImage).toHaveBeenCalledTimes(2);
  });

  it("rejects after exhausting retries without crossing threshold", async () => {
    vi.mocked(performOcr).mockResolvedValue({
      text: "blurry text",
      confidence: 0.35,
      source: "local",
      processingTimeMs: 50,
      warnings: [],
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(false);
    expect(result.confidence).toBe(0.35);
    expect(result.rejectionReason).toBe("low_confidence");
    expect(result.rejectionAdvice).toContain("blurry");
    expect(preprocessImage).toHaveBeenCalledTimes(3);
  });

  it("accepts when retry matches threshold exactly", async () => {
    let callCount = 0;
    vi.mocked(performOcr).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          text: "Glucose: 95",
          confidence: 0.5,
          source: "local",
          processingTimeMs: 50,
          warnings: [],
        };
      }
      return {
        text: "Glucose: 95 mg/dL",
        confidence: 0.7,
        source: "local",
        processingTimeMs: 50,
        warnings: [],
      };
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it("keeps best result across retries even if retry is worse", async () => {
    let callCount = 0;
    vi.mocked(performOcr).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          text: "Good text here",
          confidence: 0.65,
          source: "local",
          processingTimeMs: 50,
          warnings: [],
        };
      }
      return {
        text: "Bad text",
        confidence: 0.4,
        source: "local",
        processingTimeMs: 50,
        warnings: [],
      };
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(false);
    expect(result.text).toBe("Good text here");
    expect(result.confidence).toBe(0.65);
  });

  it("returns success:false on empty OCR text", async () => {
    vi.mocked(performOcr).mockResolvedValue({
      text: "",
      confidence: 0,
      source: "local",
      processingTimeMs: 50,
      warnings: [],
    });

    const result = await runOcrWithRetry("dGVzdA==");

    expect(result.accepted).toBe(false);
    expect(result.success).toBe(false);
    expect(result.text).toBe("");
  });
});

describe("buildRejectionResponse", () => {
  const baseResult = {
    success: false,
    accepted: false,
    text: "",
    confidence: 0.3,
    pages: [],
    source: "local" as const,
    warnings: ["low clarity"],
    rejectionReason: "low_confidence",
    rejectionAdvice: "The document appears too blurry",
    processingTimeMs: 200,
  };

  it("returns structured error with confidence and advice", () => {
    const res = buildRejectionResponse(baseResult, "Filipino");

    expect(res.status).toBe("error");
    expect(res.confidence).toBe(0.3);
    expect(res.error).toContain("blurry");
    expect(res.language).toBe("Filipino");
  });

  it("falls back to English for unknown languages", () => {
    const res = buildRejectionResponse(baseResult, "Klingon");

    expect(res.language).toBe("English");
  });

  it("includes warnings in response", () => {
    const res = buildRejectionResponse(baseResult, "English");

    expect(res.warnings).toContain("low clarity");
  });
});
