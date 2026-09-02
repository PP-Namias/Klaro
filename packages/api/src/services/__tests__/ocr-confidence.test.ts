import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guard for the defect that made every scan fail.
 *
 * performOcr used to read `data.lines`, which tesseract.js does not return.
 * Confidence therefore computed to 0 on every page and runOcrWithRetry rejected
 * the document as unreadable — no upload could ever succeed.
 */

const recognize = vi.fn();
const terminate = vi.fn();

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(() => Promise.resolve({ recognize, terminate })),
}));

async function loadPerformOcr() {
  const mod = await import("../ocr");
  return mod.performOcr;
}

function page(data: Record<string, unknown>) {
  return { data };
}

describe("performOcr confidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminate.mockResolvedValue(undefined);
  });

  it("requests block output so tesseract populates data.blocks", async () => {
    recognize.mockResolvedValue(
      page({ text: "x", confidence: 90, blocks: [] }),
    );

    const performOcr = await loadPerformOcr();
    await performOcr(Buffer.from("img"));

    // createWorker defaults to { text: true }; blocks must be requested.
    expect(recognize).toHaveBeenCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ blocks: true }),
    );
  });

  it("derives confidence from the page-level MeanTextConf", async () => {
    recognize.mockResolvedValue(
      page({ text: "Hemoglobin 11.2", confidence: 87.5, blocks: [] }),
    );

    const performOcr = await loadPerformOcr();
    const result = await performOcr(Buffer.from("img"));

    expect(result.confidence).toBeCloseTo(0.875, 5);
  });

  it("stays non-zero when blocks are empty but confidence is present", async () => {
    recognize.mockResolvedValue(
      page({ text: "text", confidence: 72, blocks: null }),
    );

    const performOcr = await loadPerformOcr();
    const result = await performOcr(Buffer.from("img"));

    // The old implementation returned 0 here, which rejected the document.
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.blocks).toEqual([]);
  });

  it("flattens blocks -> paragraphs -> lines into OcrBlocks", async () => {
    recognize.mockResolvedValue(
      page({
        text: "full text",
        confidence: 91,
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  { text: "  Hemoglobin 11.2 g/dL ", confidence: 95 },
                  { text: "", confidence: 10 },
                ],
              },
              { lines: [{ text: "Glucose 142 mg/dL", confidence: 88 }] },
            ],
          },
          null,
        ],
      }),
    );

    const performOcr = await loadPerformOcr();
    const result = await performOcr(Buffer.from("img"));

    // Empty lines are dropped and confidences are normalised to 0..1.
    expect(result.blocks).toEqual([
      { text: "Hemoglobin 11.2 g/dL", confidence: 0.95 },
      { text: "Glucose 142 mg/dL", confidence: 0.88 },
    ]);
  });

  it("clamps an out-of-range confidence and always terminates the worker", async () => {
    recognize.mockResolvedValue(
      page({ text: "t", confidence: 140, blocks: [] }),
    );

    const performOcr = await loadPerformOcr();
    const result = await performOcr(Buffer.from("img"));

    expect(result.confidence).toBe(1);
    expect(terminate).toHaveBeenCalled();
  });

  it("terminates the worker even when recognition throws", async () => {
    recognize.mockRejectedValue(new Error("boom"));

    const performOcr = await loadPerformOcr();
    await expect(performOcr(Buffer.from("img"))).rejects.toThrow("boom");
    expect(terminate).toHaveBeenCalled();
  });
});
