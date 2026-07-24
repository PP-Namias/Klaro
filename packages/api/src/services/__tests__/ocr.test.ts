import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OcrBlock, OcrResult } from "../ocr";
import {
  buildOcrAudit,
  buildOcrResult,
  computeConfidence,
  getOcrConfidenceThreshold,
  shouldUseCloudFallback,
} from "../ocr";

describe("OCR Service", () => {
  describe("computeConfidence", () => {
    it("returns 0 for empty blocks", () => {
      expect(computeConfidence([])).toBe(0);
    });

    it("computes average confidence from blocks", () => {
      const blocks: OcrBlock[] = [
        { text: "line1", confidence: 0.8 },
        { text: "line2", confidence: 0.9 },
      ];
      expect(computeConfidence(blocks)).toBeCloseTo(0.85);
    });

    it("uses default confidence when not provided", () => {
      const blocks: OcrBlock[] = [{ text: "line1" }];
      expect(computeConfidence(blocks)).toBe(0.7);
    });

    it("clamps confidence to 0-1 range", () => {
      const blocks: OcrBlock[] = [{ text: "line1", confidence: 1.5 }];
      expect(computeConfidence(blocks)).toBe(1);
    });

    it("handles negative confidence", () => {
      const blocks: OcrBlock[] = [{ text: "line1", confidence: -0.5 }];
      expect(computeConfidence(blocks)).toBe(0);
    });
  });

  describe("buildOcrResult", () => {
    it("creates result with provided text", () => {
      const result = buildOcrResult({ text: "Hello World" });
      expect(result.text).toBe("Hello World");
      expect(result.source).toBe("local");
    });

    it("trims whitespace from text", () => {
      const result = buildOcrResult({ text: "  Hello  " });
      expect(result.text).toBe("Hello");
    });

    it("uses provided confidence", () => {
      const result = buildOcrResult({ text: "text", confidence: 0.95 });
      expect(result.confidence).toBe(0.95);
    });

    it("computes confidence from blocks when not provided", () => {
      const result = buildOcrResult({
        text: "text",
        blocks: [{ text: "line1", confidence: 0.8 }],
      });
      expect(result.confidence).toBe(0.8);
    });

    it("uses specified source", () => {
      const result = buildOcrResult({ text: "text", source: "cloud" });
      expect(result.source).toBe("cloud");
    });
  });

  describe("shouldUseCloudFallback", () => {
    it("returns true when confidence below threshold", () => {
      expect(shouldUseCloudFallback(0.5, 0.7)).toBe(true);
    });

    it("returns false when confidence above threshold", () => {
      expect(shouldUseCloudFallback(0.9, 0.7)).toBe(false);
    });

    it("returns false when confidence equals threshold", () => {
      expect(shouldUseCloudFallback(0.7, 0.7)).toBe(false);
    });

    it("uses default threshold of 0.7", () => {
      expect(shouldUseCloudFallback(0.6)).toBe(true);
      expect(shouldUseCloudFallback(0.8)).toBe(false);
    });
  });

  describe("getOcrConfidenceThreshold", () => {
    const originalEnv = process.env.OCR_CONFIDENCE_THRESHOLD;

    beforeEach(() => {
      process.env.OCR_CONFIDENCE_THRESHOLD = originalEnv;
    });

    it("returns default threshold when env not set", () => {
      delete process.env.OCR_CONFIDENCE_THRESHOLD;
      expect(getOcrConfidenceThreshold()).toBe(0.7);
    });

    it("returns env value when set", () => {
      process.env.OCR_CONFIDENCE_THRESHOLD = "0.8";
      expect(getOcrConfidenceThreshold()).toBe(0.8);
    });

    it("returns default for non-numeric env", () => {
      process.env.OCR_CONFIDENCE_THRESHOLD = "abc";
      expect(getOcrConfidenceThreshold()).toBe(0.7);
    });

    it("clamps env value to 0-1", () => {
      process.env.OCR_CONFIDENCE_THRESHOLD = "2.0";
      expect(getOcrConfidenceThreshold()).toBe(1);
    });
  });

  describe("buildOcrAudit", () => {
    it("creates audit with local result only", () => {
      const local: OcrResult = {
        text: "text",
        confidence: 0.8,
        blocks: [],
        source: "local",
      };

      const audit = buildOcrAudit({
        local,
        selected: local,
        threshold: 0.7,
        usedCloudFallback: false,
      });

      expect(audit.source).toBe("local");
      expect(audit.usedCloudFallback).toBe(false);
      expect(audit.confidenceDelta).toBe(0);
    });

    it("creates audit with cloud fallback", () => {
      const local: OcrResult = {
        text: "local",
        confidence: 0.6,
        blocks: [],
        source: "local",
      };
      const cloud: OcrResult = {
        text: "cloud",
        confidence: 0.9,
        blocks: [],
        source: "cloud",
      };

      const audit = buildOcrAudit({
        local,
        cloud,
        selected: cloud,
        threshold: 0.7,
        usedCloudFallback: true,
      });

      expect(audit.source).toBe("cloud");
      expect(audit.usedCloudFallback).toBe(true);
      expect(audit.confidenceDelta).toBe(0.3);
    });
  });
});
