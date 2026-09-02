import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A low-confidence extraction used to be returned as-is. The scan path now
 * reprocesses once when the model's confidence falls below the configured
 * Gemini threshold, and returns whichever attempt scored higher.
 */

const runOcrWithRetry = vi.fn();
const buildRejectionResponse = vi.fn();
const executeDocumentPipeline = vi.fn();

vi.mock("../../services/ocrPipeline", () => ({
  runOcrWithRetry: (...a: unknown[]) => runOcrWithRetry(...a),
  runOcrOnPages: vi.fn(),
  buildRejectionResponse: (...a: unknown[]) => buildRejectionResponse(...a),
}));

vi.mock("../../services/documentPipeline", () => ({
  executeDocumentPipeline: (...a: unknown[]) => executeDocumentPipeline(...a),
}));

const IMAGE = Buffer.from("x".repeat(200)).toString("base64");

function pipelineResult(confidence: number, summary: string) {
  return {
    accepted: true,
    ocrConfidence: confidence,
    geminiConfidence: confidence,
    extractedData: {},
    plainLanguageSummary: summary,
    urgency: "LOW",
    recommendations: ["Follow up"],
    warnings: [],
    path: "test",
    timing: { total: 1 },
  };
}

async function callScan() {
  const { createCallerFactory, createTRPCRouter } = await import("../../trpc");
  const { documentsRouter } = await import("../../router/documents");
  const router = createTRPCRouter({ documents: documentsRouter });
  const caller = createCallerFactory(router)({
    db: {} as never,
    session: null,
  } as never);

  return caller.documents.scanGuestImage({
    base64Image: IMAGE,
    language: "English",
  });
}

describe("scanGuestImage low-confidence reprocessing", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.GEMINI_CONFIDENCE_THRESHOLD = "0.6";
    runOcrWithRetry.mockResolvedValue({
      accepted: true,
      text: "Hemoglobin 11.2",
      confidence: 0.9,
      source: "local",
      warnings: [],
      pages: [],
      success: true,
      processingTimeMs: 1,
    });
  });

  it("retries exactly once when confidence is below the threshold", async () => {
    executeDocumentPipeline
      .mockResolvedValueOnce(pipelineResult(0.4, "first"))
      .mockResolvedValueOnce(pipelineResult(0.8, "second"));

    const result = await callScan();

    expect(executeDocumentPipeline).toHaveBeenCalledTimes(2);
    expect(result.warnings).toContain("reprocessed:low_confidence");
    // The better attempt wins.
    expect(result.plainLanguageSummary).toBe("second");
    expect(result.confidence).toBe(0.8);
  });

  it("keeps the first attempt when the retry scores no better", async () => {
    executeDocumentPipeline
      .mockResolvedValueOnce(pipelineResult(0.5, "first"))
      .mockResolvedValueOnce(pipelineResult(0.2, "worse"));

    const result = await callScan();

    expect(executeDocumentPipeline).toHaveBeenCalledTimes(2);
    expect(result.plainLanguageSummary).toBe("first");
  });

  it("does not retry when confidence meets the threshold", async () => {
    executeDocumentPipeline.mockResolvedValue(pipelineResult(0.9, "confident"));

    const result = await callScan();

    expect(executeDocumentPipeline).toHaveBeenCalledTimes(1);
    expect(result.warnings).not.toContain("reprocessed:low_confidence");
  });

  it("keeps the first attempt when the retry itself throws", async () => {
    executeDocumentPipeline
      .mockResolvedValueOnce(pipelineResult(0.3, "first"))
      .mockRejectedValueOnce(new Error("retry exploded"));

    const result = await callScan();

    expect(result.plainLanguageSummary).toBe("first");
    expect(result.warnings).toContain("reprocessed:low_confidence");
  });
});

describe("degraded results are self-identifying", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    runOcrWithRetry.mockResolvedValue({
      accepted: true,
      text: "Hemoglobin 11.2",
      confidence: 0.9,
      source: "local",
      warnings: [],
      pages: [],
      success: true,
      processingTimeMs: 1,
    });
  });

  it("never relabels a mock upstream as a real Gemini analysis", async () => {
    executeDocumentPipeline.mockRejectedValue(new Error("no pipeline"));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              requestId: "svc-1",
              source: "mock",
              plainLanguageSummary: "mocked",
              urgency: "LOW",
              recommendations: ["x"],
            }),
          text: () => Promise.resolve(""),
        } as unknown as Response),
      ),
    );

    const result = await callScan();

    expect(result.source).toBe("mock");
    vi.unstubAllGlobals();
  });

  it("omits confidence when the upstream reports none", async () => {
    executeDocumentPipeline.mockRejectedValue(new Error("no pipeline"));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              requestId: "svc-2",
              plainLanguageSummary: "no score given",
              urgency: "LOW",
              recommendations: ["x"],
            }),
          text: () => Promise.resolve(""),
        } as unknown as Response),
      ),
    );

    const result = await callScan();

    // Previously this was silently reported as 0.85.
    expect(result.confidence).toBeUndefined();
    expect(result.source).toBe("raw");
    vi.unstubAllGlobals();
  });

  it("marks a hard fallback as degraded and gives it no confidence", async () => {
    executeDocumentPipeline.mockRejectedValue(new Error("no pipeline"));
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("service down"))),
    );

    const result = await callScan();

    expect(result.source).toBe("fallback");
    expect(result.confidence).toBeUndefined();
    expect(result.warnings).toContain("degraded:fallback");
    vi.unstubAllGlobals();
  });
});
