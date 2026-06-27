import { describe, expect, it } from "vitest";

import {
  getTranslation,
  formatPatientInfoSection,
  formatDiagnosisSection,
  formatMedicationsSection,
  formatLabResultsSection,
  generatePlainLanguageSummary,
} from "../plainLanguage";

describe("Plain Language Generation", () => {
  describe("getTranslation", () => {
    it("returns English translation", () => {
      expect(getTranslation("en", "patientInformation")).toBe("Patient Information");
    });

    it("returns Filipino translation", () => {
      expect(getTranslation("fil", "patientInformation")).toBe("Impormasyon ng Pasyente");
    });

    it("returns Tagalog translation", () => {
      expect(getTranslation("tl", "medications")).toBe("Mga Tambal");
    });

    it("returns key if translation missing", () => {
      expect(getTranslation("en", "nonexistent")).toBe("nonexistent");
    });
  });

  describe("formatPatientInfoSection", () => {
    it("formats patient info in English", () => {
      const section = formatPatientInfoSection(
        {
          patientName: "John Doe",
          dateOfBirth: "1990-01-01",
          gender: "Male",
          address: "123 Main St",
          phoneNumber: "09171234567",
          email: "john@test.com",
        },
        "en",
      );

      expect(section.title).toBe("Patient Information");
      expect(section.items).toHaveLength(6);
      expect(section.items[0]).toContain("John Doe");
    });

    it("formats patient info in Filipino", () => {
      const section = formatPatientInfoSection(
        { patientName: "Juan" },
        "fil",
      );

      expect(section.title).toBe("Impormasyon ng Pasyente");
      expect(section.items[0]).toContain("Juan");
    });

    it("skips missing fields", () => {
      const section = formatPatientInfoSection({ patientName: "John" }, "en");
      expect(section.items).toHaveLength(1);
    });
  });

  describe("formatDiagnosisSection", () => {
    it("formats diagnosis list", () => {
      const section = formatDiagnosisSection(
        ["Hypertension", "Diabetes Type 2"],
        "en",
      );

      expect(section.title).toBe("Diagnosis");
      expect(section.items).toHaveLength(2);
      expect(section.content).toContain("Hypertension");
    });

    it("handles single diagnosis", () => {
      const section = formatDiagnosisSection(["Asthma"], "fil");
      expect(section.items).toHaveLength(1);
    });
  });

  describe("formatMedicationsSection", () => {
    it("formats medications with dosage and frequency", () => {
      const section = formatMedicationsSection(
        [
          { name: "Amlodipine", dosage: "5mg", frequency: "Once daily" },
          { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
        ],
        "en",
      );

      expect(section.title).toBe("Medications");
      expect(section.items).toHaveLength(2);
      expect(section.items[0]).toContain("Amlodipine");
      expect(section.items[0]).toContain("5mg");
    });
  });

  describe("formatLabResultsSection", () => {
    it("formats lab results", () => {
      const section = formatLabResultsSection(
        [
          {
            testName: "Blood Glucose",
            value: "110",
            unit: "mg/dL",
            referenceRange: "70-100",
          },
        ],
        "en",
      );

      expect(section.title).toBe("Lab Results");
      expect(section.items[0]).toContain("Blood Glucose");
      expect(section.items[0]).toContain("110 mg/dL");
    });
  });

  describe("generatePlainLanguageSummary", () => {
    it("generates complete summary", () => {
      const result = generatePlainLanguageSummary({
        patientName: "John Doe",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg", frequency: "Daily" }],
        labResults: [
          {
            testName: "BP",
            value: "130/85",
            unit: "mmHg",
            referenceRange: "120/80",
          },
        ],
      });

      expect(result.language).toBe("en");
      expect(result.sections.length).toBeGreaterThanOrEqual(3);
      expect(result.plainText).toContain("Patient Information");
      expect(result.plainText).toContain("Diagnosis");
      expect(result.plainText).toContain("Medications");
    });

    it("uses Filipino language", () => {
      const result = generatePlainLanguageSummary(
        { patientName: "Juan" },
        { language: "fil" },
      );

      expect(result.language).toBe("fil");
      expect(result.sections[0].title).toBe("Impormasyon ng Pasyente");
    });

    it("handles empty data gracefully", () => {
      const result = generatePlainLanguageSummary({});
      expect(result.sections).toHaveLength(1);
      expect(result.plainText).toContain("Patient Information");
    });

    it("skips sections with no data", () => {
      const result = generatePlainLanguageSummary({
        patientName: "John",
        diagnosis: [],
        medications: [],
      });

      expect(result.sections).toHaveLength(1);
    });
  });
});
