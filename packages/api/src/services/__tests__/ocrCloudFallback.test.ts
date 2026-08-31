import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * cloudOcr.ts implemented the Google Vision REST fallback correctly but nothing
 * ever called it: runOcrWithRetry gave up after its local retries and returned
 * a low-confidence rejection. These tests pin the escalation path.
 */

const performOcr = vi.fn();
const cloudOcrWithRetry = vi.fn();
const getCloudOcrApiKey = vi.fn();

vi.mock("../ocr", async () => {
  const actual = await vi.importActual<typeof import("../ocr")>("../ocr");
  return { ...actual, performOcr: (...a: unknown[]) => performOcr(...a) };
});

vi.mock("../cloudOcr", () => ({
  cloudOcrWithRetry: (...a: unknown[]) => cloudOcrWithRetry(...a),
  getCloudOcrApiKey: () => getCloudOcrApiKey(),
}));

const preprocessImage = vi.fn((base64: string, _opts?: unknown) =>
  Promise.resolve({
    base64,
    buffer: Buffer.from(""),
    width: 1,
    height: 1,
    applied: [],
  }),
);

vi.mock("../imagePreprocessor", () => ({
  preprocessImage: (base64: string, opts?: unknown) =>
    preprocessImage(base64, opts),
  getDefaultPreprocessingOptions: () => ({}),
}));

const IMAGE = Buffer.from("x".repeat(200)).toString("base64");

async function runPipeline() {
  const { runOcrWithRetry } = await import("../ocrPipeline");
  return runOcrWithRetry(IMAGE);
}

describe("runOcrWithRetry cloud fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OCR_CONFIDENCE_THRESHOLD = "0.7";
    process.env.OCR_MAX_RETRIES = "1";
    // Local OCR always lands under the threshold.
    performOcr.mockResolvedValue({
      text: "blurry",
      confidence: 0.2,
      blocks: [],
      source: "local",
    });
  });

  it("does not call cloud OCR when the fallback is disabled", async () => {
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "false";

    const result = await runPipeline();

    expect(cloudOcrWithRetry).not.toHaveBeenCalled();
    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("low_confidence");
  });

  it("does not call cloud OCR when no API key is configured", async () => {
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "true";
    getCloudOcrApiKey.mockReturnValue(null);

    const result = await runPipeline();

    expect(cloudOcrWithRetry).not.toHaveBeenCalled();
    expect(result.accepted).toBe(false);
    expect(result.warnings.join(" ")).toContain("no API key");
  });

  it("accepts the document when cloud OCR clears the threshold", async () => {
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "true";
    getCloudOcrApiKey.mockReturnValue("vision-key");
    cloudOcrWithRetry.mockResolvedValue({
      text: "Hemoglobin 11.2 g/dL",
      confidence: 0.94,
      blocks: [],
    });

    const result = await runPipeline();

    expect(cloudOcrWithRetry).toHaveBeenCalledWith(IMAGE);
    expect(result.accepted).toBe(true);
    expect(result.source).toBe("cloud");
    expect(result.text).toContain("Hemoglobin");
    expect(result.rejectionReason).toBeUndefined();
  });

  it("still rejects locally when cloud OCR is also low confidence", async () => {
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "true";
    getCloudOcrApiKey.mockReturnValue("vision-key");
    cloudOcrWithRetry.mockResolvedValue({
      text: "??",
      confidence: 0.3,
      blocks: [],
    });

    const result = await runPipeline();

    expect(result.accepted).toBe(false);
    expect(result.warnings.join(" ")).toContain("also below threshold");
  });

  it("degrades to the local rejection when Vision throws", async () => {
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "true";
    getCloudOcrApiKey.mockReturnValue("vision-key");
    cloudOcrWithRetry.mockRejectedValue(new Error("vision unavailable"));

    const result = await runPipeline();

    // The outage must not propagate as an exception.
    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("low_confidence");
    expect(result.warnings.join(" ")).toContain("vision unavailable");
  });
});

describe("runOcrWithRetry first-pass preprocessing", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OCR_CONFIDENCE_THRESHOLD = "0.7";
    process.env.OCR_MAX_RETRIES = "0";
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "false";
    performOcr.mockResolvedValue({
      text: "ok",
      confidence: 0.95,
      blocks: [],
      source: "local",
    });
  });

  it("preprocesses before the first OCR read when enabled", async () => {
    process.env.OCR_ENABLE_PREPROCESSING = "true";

    await runPipeline();

    expect(preprocessImage).toHaveBeenCalledTimes(1);
    expect(preprocessImage).toHaveBeenCalledWith(IMAGE, expect.anything());
  });

  it("skips preprocessing when disabled", async () => {
    process.env.OCR_ENABLE_PREPROCESSING = "false";

    await runPipeline();

    expect(preprocessImage).not.toHaveBeenCalled();
  });

  it("falls back to the raw image when preprocessing throws", async () => {
    process.env.OCR_ENABLE_PREPROCESSING = "true";
    preprocessImage.mockRejectedValueOnce(new Error("sharp exploded"));

    const result = await runPipeline();

    // OCR still ran, and the failure is recorded rather than thrown.
    expect(performOcr).toHaveBeenCalled();
    expect(result.warnings.join(" ")).toContain("sharp exploded");
  });

  it("includes pipeline configuration warnings in the result", async () => {
    process.env.OCR_ENABLE_PREPROCESSING = "false";
    const previousKey = process.env.GEMINI_API_KEY;
    const previousLlmKey = process.env.LLM_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.LLM_API_KEY;

    const result = await runPipeline();

    expect(result.warnings.join(" ")).toContain("GEMINI_API_KEY not set");

    if (previousKey !== undefined) process.env.GEMINI_API_KEY = previousKey;
    if (previousLlmKey !== undefined) process.env.LLM_API_KEY = previousLlmKey;
  });
});
