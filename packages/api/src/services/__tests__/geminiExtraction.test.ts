import { describe, expect, it } from "vitest";

import {
  getExtractionPromptDefaults,
  buildExtractionPrompt,
  parseGeminiResponse,
  calculateExtractionConfidence,
  validateExtractionData,
  formatExtractionResult,
} from "../geminiExtraction";
import type { GeminiExtractionResult } from "../geminiExtraction";

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
      {"patientName": "John", "dateOfBirth": "1990-01-01"}`;

      const parsed = parseGeminiResponse(response);
      expect(parsed).toEqual({
        patientName: "John",
        dateOfBirth: "1990-01-01",
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
      const confidence = calculateExtractionConfidence({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        address: "123 Main St",
        insuranceProvider: "PhilHealth",
        policyNumber: "PH123",
        phoneNumber: "09171234567",
        email: "john@test.com",
        emergencyContact: { name: "Jane", relationship: "Wife", phone: "09181234567" },
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg", frequency: "Daily" }],
        allergies: ["Penicillin"],
        labResults: [{ testName: "CBC", value: "120", unit: "g/L", referenceRange: "120-160" }],
        vitalSigns: [{ type: "BP", value: "130/85", unit: "mmHg" }],
        medicalHistory: ["None"],
        notes: "Routine checkup",
      });
      expect(confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("returns low confidence for minimal data", () => {
      const confidence = calculateExtractionConfidence({
        patientName: "John",
      });
      expect(confidence).toBeLessThan(0.3);
    });

    it("returns 0 for empty data", () => {
      expect(calculateExtractionConfidence({})).toBe(0);
    });

    it("weights required fields higher", () => {
      const requiredOnly = calculateExtractionConfidence({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        address: "123 Main St",
        insuranceProvider: "PhilHealth",
        policyNumber: "PH123",
      });

      const optionalOnly = calculateExtractionConfidence({
        phoneNumber: "09171234567",
        email: "john@test.com",
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg", frequency: "Daily" }],
        allergies: ["Penicillin"],
        labResults: [{ testName: "CBC", value: "120", unit: "g/L", referenceRange: "120-160" }],
      });

      expect(requiredOnly).toBeGreaterThan(optionalOnly);
    });
  });

  describe("validateExtractionData", () => {
    it("returns no errors for valid data", () => {
      const errors = validateExtractionData({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        gender: "Male",
      });
      expect(errors).toHaveLength(0);
    });

    it("requires patientName", () => {
      const errors = validateExtractionData({
        dateOfBirth: "1990-01-01",
        gender: "Male",
      });
      expect(errors.some((e) => e.includes("patientName"))).toBe(true);
    });

    it("validates dateOfBirth format", () => {
      const errors = validateExtractionData({
        patientName: "John",
        dateOfBirth: "01/01/1990",
        gender: "Male",
      });
      expect(errors.some((e) => e.includes("YYYY-MM-DD"))).toBe(true);
    });

    it("validates diagnosis is array", () => {
      const errors = validateExtractionData({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        diagnosis: "Hypertension",
      });
      expect(errors.some((e) => e.includes("diagnosis"))).toBe(true);
    });

    it("validates medications is array", () => {
      const errors = validateExtractionData({
        patientName: "John",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        medications: "Amlodipine",
      });
      expect(errors.some((e) => e.includes("medications"))).toBe(true);
    });
  });

  describe("formatExtractionResult", () => {
    it("formats success result", () => {
      const result: GeminiExtractionResult = {
        success: true,
        confidence: 0.85,
        model: "gemini-2.5-flash",
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("85.0%");
      expect(formatted).toContain("gemini-2.5-flash");
    });

    it("formats failure result", () => {
      const result: GeminiExtractionResult = {
        success: false,
        error: "API rate limit",
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("failed");
      expect(formatted).toContain("API rate limit");
    });

    it("handles missing confidence", () => {
      const result: GeminiExtractionResult = {
        success: true,
      };
      const formatted = formatExtractionResult(result);
      expect(formatted).toContain("successful");
    });
  });
});
