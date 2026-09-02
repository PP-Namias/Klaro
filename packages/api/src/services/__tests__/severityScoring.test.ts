import { describe, expect, it } from "vitest";

import {
  batchCalculateSeverity,
  calculateSeverity,
  getOverallSeverity,
  getSeverityColor,
  getSeverityIcon,
  hasCriticalValues,
  hasHighValues,
  REFERENCE_RANGES,
} from "../severityScoring";

describe("Severity Scoring", () => {
  describe("calculateSeverity", () => {
    it("returns normal for values in range", () => {
      const result = calculateSeverity("HGB", 14);
      expect(result.severity).toBe("normal");
      expect(result.color).toBe("#10B981");
    });

    it("returns high for values above range", () => {
      const result = calculateSeverity("GLU", 120);
      expect(result.severity).toBe("high");
    });

    it("returns critical for values far above range", () => {
      const result = calculateSeverity("GLU", 200);
      expect(result.severity).toBe("critical");
    });

    it("returns high for values below range", () => {
      const result = calculateSeverity("HGB", 10);
      expect(result.severity).toBe("high");
    });

    it("returns critical for values far below range", () => {
      const result = calculateSeverity("HGB", 5);
      expect(result.severity).toBe("critical");
    });

    it("handles unknown test codes", () => {
      const result = calculateSeverity("UNKNOWN", 100);
      expect(result.severity).toBe("normal");
      expect(result.message).toContain("No reference range");
    });
  });

  describe("getSeverityColor", () => {
    it("returns correct colors", () => {
      expect(getSeverityColor("normal")).toBe("#10B981");
      expect(getSeverityColor("borderline")).toBe("#F59E0B");
      expect(getSeverityColor("high")).toBe("#EF4444");
      expect(getSeverityColor("critical")).toBe("#DC2626");
    });
  });

  describe("getSeverityIcon", () => {
    it("returns correct icons", () => {
      expect(getSeverityIcon("normal")).toBe("✅");
      expect(getSeverityIcon("borderline")).toBe("⚠️");
      expect(getSeverityIcon("high")).toBe("🔴");
      expect(getSeverityIcon("critical")).toBe("🚨");
    });
  });

  describe("batchCalculateSeverity", () => {
    it("processes multiple tests", () => {
      const results = batchCalculateSeverity([
        { code: "HGB", value: 14 },
        // GLU range is 70-100. 110 sits inside the +10% band, so it is
        // borderline; 125 is further out and reads as high.
        { code: "GLU", value: 110 },
        { code: "CRE", value: 1.4 },
      ]);
      expect(results).toHaveLength(3);
      expect(results[0].severity).toBe("normal");
      expect(results[1].severity).toBe("borderline");
      expect(results[2].severity).toBe("high");
    });
  });

  describe("hasCriticalValues", () => {
    it("returns true when critical values exist", () => {
      const results = batchCalculateSeverity([{ code: "GLU", value: 300 }]);
      expect(hasCriticalValues(results)).toBe(true);
    });

    it("returns false when no critical values", () => {
      const results = batchCalculateSeverity([{ code: "HGB", value: 14 }]);
      expect(hasCriticalValues(results)).toBe(false);
    });
  });

  describe("hasHighValues", () => {
    it("returns true when high values exist", () => {
      const results = batchCalculateSeverity([{ code: "GLU", value: 120 }]);
      expect(hasHighValues(results)).toBe(true);
    });

    it("returns false when all normal", () => {
      const results = batchCalculateSeverity([{ code: "HGB", value: 14 }]);
      expect(hasHighValues(results)).toBe(false);
    });
  });

  describe("getOverallSeverity", () => {
    it("returns critical when any critical", () => {
      const results = batchCalculateSeverity([
        { code: "HGB", value: 14 },
        { code: "GLU", value: 300 },
      ]);
      expect(getOverallSeverity(results)).toBe("critical");
    });

    it("returns high when any high", () => {
      const results = batchCalculateSeverity([
        { code: "HGB", value: 14 },
        { code: "GLU", value: 120 },
      ]);
      expect(getOverallSeverity(results)).toBe("high");
    });

    it("returns normal when all normal", () => {
      const results = batchCalculateSeverity([
        { code: "HGB", value: 14 },
        { code: "GLU", value: 90 },
      ]);
      expect(getOverallSeverity(results)).toBe("normal");
    });
  });
});
