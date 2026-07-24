import { describe, expect, it } from "vitest";

import type { MedicalPromptConfig } from "../geminiPrompts";
import {
  buildExtractionPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  detectDocumentType,
  validatePromptConfig,
} from "../geminiPrompts";

describe("Gemini Prompts", () => {
  describe("detectDocumentType", () => {
    it("detects lab results", () => {
      expect(detectDocumentType("Laboratory Result - Blood Chemistry")).toBe(
        "lab_result",
      );
      expect(detectDocumentType("Hemoglobin: 12.5 g/dL")).toBe("lab_result");
      expect(detectDocumentType("Specimen: Urine")).toBe("lab_result");
    });

    it("detects prescriptions", () => {
      expect(detectDocumentType("Prescription - Amoxicillin 500mg")).toBe(
        "prescription",
      );
      expect(detectDocumentType("Sig: Take 1 tablet daily")).toBe(
        "prescription",
      );
    });

    it("detects discharge summaries", () => {
      expect(detectDocumentType("Discharge Summary")).toBe("discharge_summary");
      expect(detectDocumentType("Attending Physician: Dr. Santos")).toBe(
        "discharge_summary",
      );
    });

    it("detects medical certificates", () => {
      expect(detectDocumentType("Medical Certificate")).toBe(
        "medical_certificate",
      );
      expect(detectDocumentType("Fit to Work Certificate")).toBe(
        "medical_certificate",
      );
    });

    it("detects imaging reports", () => {
      expect(detectDocumentType("X-Ray Report - Chest PA View")).toBe(
        "imaging_report",
      );
      expect(detectDocumentType("CT Scan Abdomen")).toBe("imaging_report");
    });

    it("returns unknown for unrecognized text", () => {
      expect(detectDocumentType("Random document text")).toBe("unknown");
    });
  });

  describe("buildSystemPrompt", () => {
    it("builds prompt with document type", () => {
      const prompt = buildSystemPrompt({ documentType: "lab_result" });
      expect(prompt).toContain("lab_result");
      expect(prompt).toContain("JSON");
    });

    it("includes language instruction", () => {
      const prompt = buildSystemPrompt({
        documentType: "prescription",
        language: "fil",
      });
      expect(prompt).toContain("Filipino");
    });

    it("omits language for English", () => {
      const prompt = buildSystemPrompt({
        documentType: "lab_result",
        language: "en",
      });
      expect(prompt).not.toContain("Respond in");
    });

    it("includes JSON structure", () => {
      const prompt = buildSystemPrompt({ documentType: "lab_result" });
      expect(prompt).toContain("patientName");
      expect(prompt).toContain("labResults");
      expect(prompt).toContain("medications");
    });
  });

  describe("buildExtractionPrompt", () => {
    it("builds lab result extraction prompt", () => {
      const prompt = buildExtractionPrompt("lab_result");
      expect(prompt).toContain("laboratory test results");
      expect(prompt).toContain("reference ranges");
    });

    it("builds prescription extraction prompt", () => {
      const prompt = buildExtractionPrompt("prescription");
      expect(prompt).toContain("Medication names");
      expect(prompt).toContain("Dosages");
    });

    it("builds discharge summary extraction prompt", () => {
      const prompt = buildExtractionPrompt("discharge_summary");
      expect(prompt).toContain("Admission and discharge dates");
      expect(prompt).toContain("diagnosis");
    });

    it("builds unknown type prompt", () => {
      const prompt = buildExtractionPrompt("unknown");
      expect(prompt).toContain("all visible medical information");
    });
  });

  describe("buildUserPrompt", () => {
    it("builds basic prompt", () => {
      const prompt = buildUserPrompt();
      expect(prompt).toContain("Analyze this medical document");
      expect(prompt).toContain("JSON");
    });

    it("includes image description", () => {
      const prompt = buildUserPrompt("Lab result with blood chemistry");
      expect(prompt).toContain("Lab result with blood chemistry");
    });

    it("includes additional context", () => {
      const prompt = buildUserPrompt(undefined, "Patient is 45 years old");
      expect(prompt).toContain("Patient is 45 years old");
    });
  });

  describe("validatePromptConfig", () => {
    it("returns no errors for valid config", () => {
      const config: MedicalPromptConfig = { documentType: "lab_result" };
      expect(validatePromptConfig(config)).toHaveLength(0);
    });

    it("returns error for invalid document type", () => {
      const config: MedicalPromptConfig = { documentType: "invalid" as any };
      const errors = validatePromptConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("returns error for unsupported language", () => {
      const config: MedicalPromptConfig = {
        documentType: "lab_result",
        language: "chinese",
      };
      const errors = validatePromptConfig(config);
      expect(errors.some((e) => e.includes("Unsupported language"))).toBe(true);
    });

    it("accepts valid languages", () => {
      const languages = ["en", "fil", "bisaya", "ilocano"];
      for (const lang of languages) {
        const config: MedicalPromptConfig = {
          documentType: "lab_result",
          language: lang,
        };
        expect(validatePromptConfig(config)).toHaveLength(0);
      }
    });
  });
});
