import { describe, expect, it } from "vitest";

import {
  normalizeText,
  detectLanguage,
  normalizeBlock,
  normalizeOcrResult,
  compareOcrResults,
  formatOcrResultForStorage,
} from "../ocrResult";

describe("OCR Result Normalization", () => {
  describe("normalizeText", () => {
    it("normalizes line endings", () => {
      expect(normalizeText("line1\r\nline2")).toBe("line1\nline2");
      expect(normalizeText("line1\rline2")).toBe("line1\nline2");
    });

    it("normalizes tabs to spaces", () => {
      expect(normalizeText("col1\tcol2")).toBe("col1 col2");
    });

    it("collapses multiple spaces", () => {
      expect(normalizeText("hello    world")).toBe("hello world");
    });

    it("limits consecutive newlines", () => {
      expect(normalizeText("a\n\n\n\n\nb")).toBe("a\n\nb");
    });

    it("trims whitespace", () => {
      expect(normalizeText("  hello  ")).toBe("hello");
    });
  });

  describe("detectLanguage", () => {
    it("detects English text", () => {
      expect(detectLanguage("Patient Name: John Doe")).toBe("en");
    });

    it("detects Filipino text", () => {
      expect(detectLanguage("Ang pangalan ng pasyente ay Juan")).toBe("fil");
    });

    it("detects Bisaya text", () => {
      expect(detectLanguage("Nindot kaayo ang panahon")).toBe("bisaya");
    });

    it("detects Ilocano text", () => {
      expect(detectLanguage("Ti nagan ti pasyente")).toBe("ilocano");
    });

    it("defaults to English for unknown", () => {
      expect(detectLanguage("12345")).toBe("en");
    });
  });

  describe("normalizeBlock", () => {
    it("normalizes block text", () => {
      const block = normalizeBlock({ text: "  Hello  ", confidence: 0.9 }, 0);
      expect(block.normalizedText).toBe("Hello");
      expect(block.confidence).toBe(0.9);
      expect(block.lineIndex).toBe(0);
    });

    it("uses default confidence when not provided", () => {
      const block = normalizeBlock({ text: "text" }, 5);
      expect(block.confidence).toBe(0);
      expect(block.lineIndex).toBe(5);
    });
  });

  describe("normalizeOcrResult", () => {
    it("normalizes raw text and blocks", () => {
      const result = normalizeOcrResult(
        "Patient Name: John Doe",
        [{ text: "Patient Name:", confidence: 0.9 }],
        "local",
      );

      expect(result.text).toBe("Patient Name: John Doe");
      expect(result.normalizedText).toBe("Patient Name: John Doe");
      expect(result.language).toBe("en");
      expect(result.blocks).toHaveLength(1);
    });

    it("detects Filipino language", () => {
      const result = normalizeOcrResult(
        "Ang pangalan ng pasyente ay Juan",
        [],
        "local",
      );
      expect(result.language).toBe("fil");
    });

    it("computes average confidence", () => {
      const result = normalizeOcrResult(
        "text",
        [
          { text: "line1", confidence: 0.8 },
          { text: "line2", confidence: 0.9 },
        ],
        "local",
      );
      expect(result.confidence).toBeCloseTo(0.85);
    });

    it("returns 0 confidence for empty blocks", () => {
      const result = normalizeOcrResult("text", [], "local");
      expect(result.confidence).toBe(0);
    });

    it("includes metadata", () => {
      const result = normalizeOcrResult("text", [{ text: "line1" }], "local");
      expect(result.metadata.totalBlocks).toBe(1);
      expect(result.metadata.detectedLanguage).toBe("en");
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("compareOcrResults", () => {
    it("detects matching results", () => {
      const r1 = normalizeOcrResult("text", [{ text: "line1", confidence: 0.9 }]);
      const r2 = normalizeOcrResult("text", [{ text: "line1", confidence: 0.9 }]);

      const diff = compareOcrResults(r1, r2);
      expect(diff.textMatch).toBe(true);
      expect(diff.confidenceDelta).toBe(0);
      expect(diff.languageMatch).toBe(true);
      expect(diff.blockCountDelta).toBe(0);
    });

    it("detects different text", () => {
      const r1 = normalizeOcrResult("text1");
      const r2 = normalizeOcrResult("text2");

      const diff = compareOcrResults(r1, r2);
      expect(diff.textMatch).toBe(false);
    });

    it("detects confidence difference", () => {
      const r1 = normalizeOcrResult("text", [{ text: "line1", confidence: 0.9 }]);
      const r2 = normalizeOcrResult("text", [{ text: "line1", confidence: 0.6 }]);

      const diff = compareOcrResults(r1, r2);
      expect(diff.confidenceDelta).toBeCloseTo(0.3);
    });
  });

  describe("formatOcrResultForStorage", () => {
    it("formats result for database storage", () => {
      const result = normalizeOcrResult(
        "raw text",
        [{ text: "line1", confidence: 0.9 }],
        "local",
      );

      const storage = formatOcrResultForStorage(result);
      expect(storage.id).toMatch(/^ocr-/);
      expect(storage.rawText).toBe("raw text");
      expect(storage.normalizedText).toBe("raw text");
      expect(storage.language).toBe("en");
      expect(typeof storage.blocks).toBe("string");
      expect(storage.createdAt).toBeInstanceOf(Date);
    });

    it("serializes blocks as JSON string", () => {
      const result = normalizeOcrResult(
        "text",
        [{ text: "line1", confidence: 0.9 }],
        "local",
      );

      const storage = formatOcrResultForStorage(result);
      const blocks = JSON.parse(storage.blocks);
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks[0].text).toBe("line1");
    });
  });
});
