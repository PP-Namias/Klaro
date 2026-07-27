import { describe, expect, it } from "vitest";

import {
  buildPreprocessDescription,
  calculateOcrConfidence,
  estimateProcessingTime,
  formatOcrOutput,
  getPreprocessDefaults,
  mergePreprocessOptions,
  shouldPreprocess,
  validatePreprocessOptions,
} from "../enhancedOcr";

describe("Enhanced OCR Service", () => {
  describe("getPreprocessDefaults", () => {
    it("returns sensible defaults", () => {
      const defaults = getPreprocessDefaults();
      expect(defaults.grayscale).toBe(true);
      expect(defaults.contrast).toBe(1.2);
      expect(defaults.brightness).toBe(1.0);
      expect(defaults.denoise).toBe(true);
      expect(defaults.deskew).toBe(false);
      expect(defaults.binarize).toBe(true);
      expect(defaults.binarizeThreshold).toBe(128);
    });
  });

  describe("validatePreprocessOptions", () => {
    it("returns no errors for valid options", () => {
      const errors = validatePreprocessOptions({
        contrast: 1.5,
        brightness: 1.2,
      });
      expect(errors).toHaveLength(0);
    });

    it("returns error for invalid contrast", () => {
      const errors = validatePreprocessOptions({ contrast: 10 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("contrast");
    });

    it("returns error for invalid brightness", () => {
      const errors = validatePreprocessOptions({ brightness: -1 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("brightness");
    });

    it("returns error for invalid binarizeThreshold", () => {
      const errors = validatePreprocessOptions({ binarizeThreshold: 300 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("binarizeThreshold");
    });

    it("returns multiple errors", () => {
      const errors = validatePreprocessOptions({
        contrast: 10,
        brightness: -1,
        binarizeThreshold: 300,
      });
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("mergePreprocessOptions", () => {
    it("merges base and override", () => {
      const base = getPreprocessDefaults();
      const merged = mergePreprocessOptions(base, {
        contrast: 2.0,
        denoise: false,
      });
      expect(merged.contrast).toBe(2.0);
      expect(merged.denoise).toBe(false);
      expect(merged.grayscale).toBe(true);
    });

    it("returns base when override is empty", () => {
      const base = getPreprocessDefaults();
      const merged = mergePreprocessOptions(base, {});
      expect(merged).toEqual(base);
    });
  });

  describe("estimateProcessingTime", () => {
    it("estimates base time for small file", () => {
      const time = estimateProcessingTime(100 * 1024, getPreprocessDefaults());
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(10000);
    });

    it("scales with file size", () => {
      const small = estimateProcessingTime(100 * 1024, getPreprocessDefaults());
      const large = estimateProcessingTime(
        10 * 1024 * 1024,
        getPreprocessDefaults(),
      );
      expect(large).toBeGreaterThan(small);
    });

    it("accounts for denoise overhead", () => {
      const noDenoise = estimateProcessingTime(1024 * 1024, { denoise: false });
      const withDenoise = estimateProcessingTime(1024 * 1024, {
        denoise: true,
      });
      expect(withDenoise).toBeGreaterThan(noDenoise);
    });
  });

  describe("shouldPreprocess", () => {
    it("returns true when grayscale enabled", () => {
      expect(shouldPreprocess({ grayscale: true })).toBe(true);
    });

    it("returns true when contrast changed", () => {
      expect(shouldPreprocess({ contrast: 1.5 })).toBe(true);
    });

    it("returns true when denoise enabled", () => {
      expect(shouldPreprocess({ denoise: true })).toBe(true);
    });

    it("returns false when no options active", () => {
      expect(shouldPreprocess({})).toBe(false);
    });

    it("returns false when contrast is 1.0", () => {
      expect(shouldPreprocess({ contrast: 1.0 })).toBe(false);
    });
  });

  describe("buildPreprocessDescription", () => {
    it("describes active options", () => {
      const desc = buildPreprocessDescription(getPreprocessDefaults());
      expect(desc).toContain("grayscale");
      expect(desc).toContain("contrast");
      expect(desc).toContain("noise reduction");
      expect(desc).toContain("binarization");
    });

    it("returns no preprocessing when empty", () => {
      const desc = buildPreprocessDescription({});
      expect(desc).toBe("no preprocessing");
    });

    it("describes single option", () => {
      const desc = buildPreprocessDescription({ denoise: true });
      expect(desc).toBe("noise reduction");
    });
  });

  describe("calculateOcrConfidence", () => {
    it("returns 0 for empty results", () => {
      expect(calculateOcrConfidence([])).toBe(0);
    });

    it("calculates average confidence", () => {
      const avg = calculateOcrConfidence([
        { confidence: 0.8 },
        { confidence: 0.9 },
      ]);
      expect(avg).toBeCloseTo(0.85);
    });

    it("handles single result", () => {
      expect(calculateOcrConfidence([{ confidence: 0.75 }])).toBe(0.75);
    });
  });

  describe("formatOcrOutput", () => {
    it("formats text with language and confidence", () => {
      const output = formatOcrOutput("Hello", 0.95, "eng");
      expect(output).toContain("eng");
      expect(output).toContain("95.0%");
      expect(output).toContain("Hello");
    });

    it("handles zero confidence", () => {
      const output = formatOcrOutput("text", 0, "eng");
      expect(output).toContain("0.0%");
    });
  });
});
