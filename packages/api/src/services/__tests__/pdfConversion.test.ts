import { describe, expect, it } from "vitest";

import { convertPdfToImages, isPdf } from "../pdfConversion";

/**
 * convertPdfToImages used to `import("canvas")`, which was never a dependency,
 * so every PDF returned success:false with "canvas module not available" and
 * no page ever reached OCR.
 */

/** Minimal single-page PDF (one blank Letter page). */
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n" +
    "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\n" +
    "trailer<</Root 1 0 R>>\n",
  "latin1",
);

describe("convertPdfToImages", () => {
  it("recognises a PDF byte signature", () => {
    expect(isPdf(MINIMAL_PDF)).toBe(true);
    expect(isPdf(Buffer.from("\x89PNG\r\n"))).toBe(false);
  });

  it("rasterises a PDF page to a PNG instead of reporting canvas missing", async () => {
    const result = await convertPdfToImages(MINIMAL_PDF);

    expect(result.error).not.toBe("canvas module not available");
    expect(result.success).toBe(true);
    expect(result.pageCount).toBe(1);

    const page = result.pages[0]!;
    expect(page.pageNumber).toBe(1);
    expect(page.width).toBeGreaterThan(0);
    expect(page.height).toBeGreaterThan(0);

    // The payload must be a real PNG, not an empty placeholder.
    const png = Buffer.from(page.base64, "base64");
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });

  it("reports failure for a genuinely unparseable PDF", async () => {
    const result = await convertPdfToImages(Buffer.from("not a pdf at all"));

    expect(result.success).toBe(false);
    expect(result.pages).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});
