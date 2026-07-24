import { describe, expect, it } from "vitest";

import {
  detectHallucinations,
  getSeverityColor,
  formatHallucinationCheck,
} from "../hallucinationDetection";

describe("Hallucination Detection", () => {
  describe("detectHallucinations", () => {
    it("returns clean result for valid data", () => {
      const ocrText = "Hemoglobin: 14.2 g/dL\nPlatelet Count: 250 K/µL";
      const tests = [
        { name: "Hemoglobin", value: "14.2", unit: "g/dL" },
        { name: "Platelet Count", value: "250", unit: "K/µL" },
      ];

      const result = detectHallucinations(ocrText, { tests }, 0.95);
      expect(result.score).toBe(0);
      expect(result.adjustedConfidence).toBe(0.95);
      expect(result.hallucinations.length).toBe(0);
      expect(result.requiresReview).toBe(false);
      expect(result.summary).toContain("No potential hallucinations");
    });

    it("flags out of plausible range values as hallucinations", () => {
      const ocrText = "Hemoglobin: 999 g/dL";
      const tests = [{ name: "Hemoglobin", value: "999", unit: "g/dL" }];

      const result = detectHallucinations(ocrText, { tests }, 0.95);
      const hall = result.hallucinations.find(
        (h) => h.type === "value_out_of_plausible_range",
      );
      expect(hall).toBeDefined();
      expect(hall?.severity).toBe("high");
      expect(result.score).toBeGreaterThan(0);
    });

    it("detects impossible combination of hemoglobin and hematocrit", () => {
      const ocrText = "Hemoglobin: 5 g/dL\nHematocrit: 60%";
      const tests = [
        { name: "Hemoglobin", value: "5", unit: "g/dL" },
        { name: "Hematocrit", value: "60", unit: "%" },
      ];

      const result = detectHallucinations(ocrText, { tests }, 0.9);
      const combo = result.hallucinations.find(
        (h) => h.type === "impossible_combination",
      );
      expect(combo).toBeDefined();
    });

    it("flags OCR mismatch when test name not found in OCR text", () => {
      const ocrText = "Some random text without lab results";
      const tests = [{ name: "Hemoglobin", value: "14.2", unit: "g/dL" }];

      const result = detectHallucinations(ocrText, { tests }, 0.9);
      const mismatch = result.hallucinations.find(
        (h) => h.type === "ocr_mismatch",
      );
      expect(mismatch).toBeDefined();
    });

    it("detects duplicate conflicting test values", () => {
      const ocrText = "Glucose: 100 mg/dL and Glucose: 200 mg/dL";
      const tests = [
        { name: "Glucose", value: "100", unit: "mg/dL" },
        { name: "Glucose", value: "200", unit: "mg/dL" },
      ];

      const result = detectHallucinations(ocrText, { tests }, 0.9);
      const dup = result.hallucinations.find(
        (h) => h.type === "duplicate_conflicting",
      );
      expect(dup).toBeDefined();
    });

    it("flags impossible negative values", () => {
      const ocrText = "Hemoglobin: -5 g/dL";
      const tests = [{ name: "Hemoglobin", value: "-5", unit: "g/dL" }];

      const result = detectHallucinations(ocrText, { tests }, 0.9);
      const neg = result.hallucinations.find(
        (h) => h.type === "negative_value",
      );
      expect(neg).toBeDefined();
      expect(neg?.severity).toBe("high");
    });

    it("returns requiresReview for high severity hallucinations", () => {
      const ocrText = "";
      const tests = [
        { name: "Hemoglobin", value: "999", unit: "g/dL" },
        { name: "WBC", value: "-50", unit: "K/µL" },
      ];

      const result = detectHallucinations(ocrText, { tests }, 0.9);
      expect(result.requiresReview).toBe(true);
      expect(result.summary).toContain("Manual review recommended");
    });

    it("adjusts confidence proportionally", () => {
      const ocrText = "Test: 9999";
      const tests = [{ name: "Hemoglobin", value: "9999", unit: "g/dL" }];

      const result = detectHallucinations(ocrText, { tests }, 1.0);
      expect(result.adjustedConfidence).toBeLessThan(1.0);
    });

    it("handles empty OCR text gracefully", () => {
      const tests = [{ name: "Hemoglobin", value: "14.2", unit: "g/dL" }];
      const result = detectHallucinations("", { tests }, 0.95);
      expect(result.hallucinations.length).toBeGreaterThanOrEqual(0);
      expect(typeof result.score).toBe("number");
    });
  });

  describe("getSeverityColor", () => {
    it("returns correct color for each severity", () => {
      expect(getSeverityColor("none")).toBe("green");
      expect(getSeverityColor("low")).toBe("yellow");
      expect(getSeverityColor("medium")).toBe("orange");
      expect(getSeverityColor("high")).toBe("red");
      expect(getSeverityColor("critical")).toBe("red");
    });
  });

  describe("formatHallucinationCheck", () => {
    it("formats check with value and range", () => {
      const check = {
        type: "value_out_of_plausible_range" as const,
        severity: "high" as const,
        description: "Value 999 is outside plausible range",
        value: "999",
        expectedRange: "2-25 g/dL",
        confidencePenalty: 0.3,
      };

      const formatted = formatHallucinationCheck(check);
      expect(formatted).toContain("[HIGH]");
      expect(formatted).toContain("Value: 999");
      expect(formatted).toContain("Expected: 2-25 g/dL");
    });
  });
});
