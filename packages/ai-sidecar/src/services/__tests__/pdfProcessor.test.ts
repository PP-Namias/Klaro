import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

import { parsePdf } from "../pdfProcessor";
import pdfParse from "pdf-parse";

function makeValidBuffer(extra = ""): Buffer {
  const header = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n" + extra;
  return Buffer.from(header);
}

describe("pdfProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parsePdf", () => {
    it("parses a valid PDF buffer", async () => {
      (pdfParse as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: "Page 1 content.\fPage 2 content.",
        version: "1.4",
        numpages: 2,
        numrender: 2,
        info: { Title: "Test" },
        metadata: {},
      });

      const result = await parsePdf(makeValidBuffer());
      expect(result.totalPages).toBe(2);
      expect(result.pages[0].text).toBe("Page 1 content.");
      expect(result.pages[1].text).toBe("Page 2 content.");
    });

    it("throws on empty buffer", async () => {
      await expect(parsePdf(Buffer.from([]))).rejects.toThrow("PDF buffer is empty");
    });

    it("throws on oversized buffer", async () => {
      const large = Buffer.alloc(101 * 1024 * 1024);
      await expect(parsePdf(large)).rejects.toThrow("PDF exceeds maximum size");
    });

    it("throws on encrypted PDF detected by header marker", async () => {
      const buf = makeValidBuffer("/Encrypt /Standard");
      await expect(parsePdf(buf)).rejects.toThrow("PDF is encrypted");
    });

    it("throws on missing PDF header", async () => {
      const buf = Buffer.from("not a pdf");
      await expect(parsePdf(buf)).rejects.toThrow("PDF header is missing or invalid");
    });

    it("throws when pdf-parse reports encrypted", async () => {
      (pdfParse as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("File is encrypted"),
      );
      await expect(parsePdf(makeValidBuffer())).rejects.toThrow("PDF is encrypted");
    });

    it("throws when pdf-parse reports corrupt", async () => {
      (pdfParse as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Corrupt PDF format"),
      );
      await expect(parsePdf(makeValidBuffer())).rejects.toThrow("PDF is corrupted");
    });

    it("throws generic error for unknown parsing failures", async () => {
      (pdfParse as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Something went wrong"),
      );
      await expect(parsePdf(makeValidBuffer())).rejects.toThrow("PDF parsing failed");
    });

    it("returns empty pages array when text is empty", async () => {
      (pdfParse as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: "",
        version: "1.4",
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: {},
      });

      const result = await parsePdf(makeValidBuffer());
      expect(result.totalPages).toBe(0);
      expect(result.pages).toEqual([]);
    });
  });
});
