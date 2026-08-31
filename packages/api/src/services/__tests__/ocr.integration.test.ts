import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";

import { performOcr } from "../ocr";

/**
 * End-to-end OCR against the real tesseract.js engine — no mocks.
 *
 * This is the guard for the defect that broke the entire product: performOcr
 * read `data.lines`, a field tesseract.js does not return, so confidence was
 * always 0 and runOcrWithRetry rejected every document. A mocked test cannot
 * catch a wrong field name, so this one drives the actual engine.
 *
 * It downloads eng.traineddata on first run and caches it under the OS temp
 * directory, so the first execution is slower than later ones.
 */

const OCR_TIMEOUT_MS = 120_000;

function renderTextImage(lines: string[]): Buffer {
  const canvas = createCanvas(760, 90 * lines.length + 40);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 56px Arial";

  lines.forEach((line, i) => ctx.fillText(line, 20, 80 + i * 90));

  return canvas.toBuffer("image/png");
}

describe("performOcr (real tesseract engine)", () => {
  it(
    "reads text from an image and reports a real confidence",
    async () => {
      process.env.TESSERACT_CACHE_PATH ??= join(tmpdir(), "tesseract");

      const image = renderTextImage(["HEMOGLOBIN 11.2", "GLUCOSE 142"]);
      const result = await performOcr(image);

      const normalized = result.text.replace(/\s+/g, " ").toUpperCase();
      expect(normalized).toContain("HEMOGLOBIN");
      expect(normalized).toContain("11.2");
      expect(normalized).toContain("GLUCOSE");
      expect(normalized).toContain("142");

      // The whole failure mode was confidence pinned at 0. A clean synthetic
      // render should score well above the 0.7 acceptance threshold.
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.source).toBe("local");
    },
    OCR_TIMEOUT_MS,
  );

  it(
    "populates per-line blocks from the engine output",
    async () => {
      process.env.TESSERACT_CACHE_PATH ??= join(tmpdir(), "tesseract");

      const image = renderTextImage(["CREATININE 1.1", "CHOLESTEROL 210"]);
      const result = await performOcr(image);

      // blocks come from blocks -> paragraphs -> lines; the old code produced [].
      expect(result.blocks.length).toBeGreaterThan(0);
      for (const block of result.blocks) {
        expect(block.text.length).toBeGreaterThan(0);
        if (block.confidence !== undefined) {
          expect(block.confidence).toBeGreaterThanOrEqual(0);
          expect(block.confidence).toBeLessThanOrEqual(1);
        }
      }
    },
    OCR_TIMEOUT_MS,
  );
});
