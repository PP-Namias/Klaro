import { describe, expect, it } from "vitest";

import type { MedicalExtractionData } from "../geminiExtraction";
import {
  buildExtractionPrompt,
  calculateExtractionConfidence,
  formatExtractionResult,
  getExtractionPromptDefaults,
  parseGeminiResponse,
  validateExtractionData,
} from "../geminiExtraction";

describe("Gemini Extraction Service", () => {
  describe("getExtractionPromptDefaults", () => {
    it("returns default options", () => {
      const defaults = getExtractionPromptDefaults();
      expect(defaults.model).toBe("gemini-2.5-flash");
      expect(defaults.temperature).toBe(0.1);
      expect(defaults.maxTokens).toBe(4096);
      expect(defaults.language).toBe("en");
    });
  });

  describe("buildExtractionPrompt", () => {
    it("builds prompt with English text", () => {
      const prompt = buildExtractionPrompt("Patient: John Doe");
      expect(prompt).toContain("Extract structured medical data");
      expect(prompt).toContain("Patient: John Doe");
    });

    it("includes language instruction for non-English", () => {
      const prompt = buildExtractionPrompt("text", "Filipino");
      expect(prompt).toContain("Filipino");
    });

    it("omits language instruction for English", () => {
      const prompt = buildExtractionPrompt("text", "en");
      expect(prompt).not.toContain("Respond in");
    });
  });

  describe("parseGeminiResponse", () => {
    it("parses valid JSON response", () => {
      const response = `Here is the extracted data:
      {"patientName": "John", "date": "1990-01-01"}`;

      const parsed = parseGeminiResponse(response);
      expect(parsed).toEqual({
        patientName: "John",
        date: "1990-01-01",
      });
    });

    it("returns null for invalid JSON", () => {
      expect(parseGeminiResponse("no json here")).toBeNull();
    });

    it("handles JSON wrapped in markdown code blocks", () => {
      const response = '```json\n{"patientName": "John"}\n```';
      const parsed = parseGeminiResponse(response);
      expect(parsed).toEqual({ patientName: "John" });
    });

    it("returns null for malformed JSON", () => {
      expect(parseGeminiResponse("{invalid json}")).toBeNull();
    });
  });

  describe("calculateExtractionConfidence", () => {
    it("returns 1.0 for complete data", () => {
      const data: MedicalExtractionData = {
        patientName: "John",
        date: "1990-01-01",
        documentType: "Lab Report",
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg", frequency: "Daily" }],
        tests: [
          { name: "CBC", value: "120", unit: "g/L", referenceRange: "120-160" },
        ],
      };
      const confidence = calculateExtractionConfidence(data);
      expect(confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("returns low confidence for minimal data", () => {
      const data: MedicalExtractionData = {
        patientName: "John",
        diagnosis: [],
        medications: [],
        tests: [],
      };
      const confidence = calculateExtractionConfidence(data);
      expect(confidence).toBeLessThan(0.3);
    });

    it("returns 0 for empty data", () => {
      const data: MedicalExtractionData = {
        tests: [],
        diagnosis: [],
        medications: [],
      };
      expect(calculateExtractionConfidence(data)).toBe(0);
    });

    it("weights fields correctly", () => {
      const requiredOnly: MedicalExtractionData = {
        patientName: "John",
        date: "1990-01-01",
        documentType: "Lab Report",
        diagnosis: ["Hypertension"],
        medications: [],
        tests: [],
      };

      const optionalOnly: MedicalExtractionData = {
        diagnosis: ["Hypertension"],
        medications: [
          { name: "Amlodipine", dosage: "5mg", frequency: "Daily" },
        ],
        tests: [
          { name: "CBC" },
          { name: "BP" },
        ],
      };

      const r = calculateExtractionConfidence(requiredOnly);
      const o = calculateExtractionConfidence(optionalOnly);
      expect(r).toBeGreaterThan(o);
    });
  });

  describe("validateExtractionData", () => {
    it("returns no errors for valid data", () => {
      const errors = validateExtractionData({
        patientName: "John",
        date: "1990-01-01",
        diagnosis: [],
        medications: [],
        tests: [],
      });
      expect(errors).toHaveLength(0);
    });

    it("validates diagnosis is array", () => {
      const data = {
        patientName: "John",
        date: "1990-01-01",
        diagnosis: "Hypertension" as unknown as string[],
        medications: [],
        tests: [],
      };
      const errors = validateExtractionData(data);
      expect(errors.some((e) => e.includes("diagnosis"))).toBe(true);
    });

    it("validates medications is array", () => {
      const data = {
        patientName: "John",
        date: "1990-01-01",
        diagnosis: [],
        medications: "Amlodipine" as unknown as MedicalExtractionData["medications"],
        tests: [],
      };
      const errors = validateExtractionData(data);
      expect(errors.some((e) => e.includes("medications"))).toBe(true);
    });

    it("validates each test has a name", () => {
      const data: MedicalExtractionData = {
        patientName: "John",
        diagnosis: [],
        medications: [],
        tests: [{} as never],
      };
      const errors = validateExtractionData(data);
      expect(errors.some((e) => e.includes("name"))).toBe(true);
    });
  });

  describe("formatExtractionResult", () => {
    it("formats success result", () => {
      const result = {
        success: true,
        confidence: 0.85,
        model: "gemini-2.5-flash",
        data: { tests: [], diagnosis: [], medications: [] },
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("85.0%");
      expect(formatted).toContain("gemini-2.5-flash");
    });

    it("formats failure result", () => {
      const result = {
        success: false,
        error: "API rate limit",
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("failed");
      expect(formatted).toContain("API rate limit");
    });

    it("handles missing confidence", () => {
      const result = {
        success: true,
        data: { tests: [], diagnosis: [], medications: [] },
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("successful");
    });
  });
});
