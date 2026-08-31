import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Multi-page OCR for rasterized PDFs. A document is accepted when at least one
 * page is readable, so one blurry page does not discard the whole report.
 */

const performOcr = vi.fn();

vi.mock("../ocr", async () => {
  const actual = await vi.importActual<typeof import("../ocr")>("../ocr");
  return { ...actual, performOcr: (...a: unknown[]) => performOcr(...a) };
});

vi.mock("../imagePreprocessor", () => ({
  preprocessImage: (base64: string) =>
    Promise.resolve({
      base64,
      buffer: Buffer.from(""),
      width: 1,
      height: 1,
      applied: [],
    }),
  getDefaultPreprocessingOptions: () => ({}),
}));

const pages = [
  { pageNumber: 1, base64: "cGFnZTE=" },
  { pageNumber: 2, base64: "cGFnZTI=" },
];

async function run(input = pages) {
  const { runOcrOnPages } = await import("../ocrPipeline");
  return runOcrOnPages(input);
}

describe("runOcrOnPages", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OCR_CONFIDENCE_THRESHOLD = "0.7";
    process.env.OCR_MAX_RETRIES = "0";
    process.env.OCR_ENABLE_CLOUD_FALLBACK = "false";
    process.env.OCR_ENABLE_PREPROCESSING = "false";
  });

  it("returns one page entry per rasterized page and joins their text", async () => {
    performOcr
      .mockResolvedValueOnce({
        text: "Hemoglobin 11.2",
        confidence: 0.9,
        blocks: [],
        source: "local",
      })
      .mockResolvedValueOnce({
        text: "Glucose 142",
        confidence: 0.88,
        blocks: [],
        source: "local",
      });

    const result = await run();

    expect(result.pages).toHaveLength(2);
    expect(result.pages.map((p) => p.pageNumber)).toEqual([1, 2]);
    expect(result.text).toBe("Hemoglobin 11.2\n\nGlucose 142");
    expect(result.accepted).toBe(true);
  });

  it("accepts the document when only one page is readable", async () => {
    performOcr
      .mockResolvedValueOnce({
        text: "readable",
        confidence: 0.95,
        blocks: [],
        source: "local",
      })
      .mockResolvedValueOnce({
        text: "",
        confidence: 0.1,
        blocks: [],
        source: "local",
      });

    const result = await run();

    expect(result.accepted).toBe(true);
    expect(result.rejectionReason).toBeUndefined();
  });

  it("rejects when no page clears the threshold", async () => {
    performOcr.mockResolvedValue({
      text: "blur",
      confidence: 0.2,
      blocks: [],
      source: "local",
    });

    const result = await run();

    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("low_confidence");
  });

  it("rejects an empty page list without throwing", async () => {
    const result = await run([]);

    expect(result.accepted).toBe(false);
    expect(result.rejectionReason).toBe("empty_document");
    expect(performOcr).not.toHaveBeenCalled();
  });
});
