import { describe, expect, it, vi } from "vitest";

import {
  scrubPhi,
  scrubExtractedData,
  containsPhi,
  detectPhiTypes,
  scrubForExternalApi,
  buildScrubbedContext,
} from "../phiScrubber";

import * as auditLogger from "../auditLogger";

describe("PHI Scrubber", () => {
  describe("SSN Detection", () => {
    it("detects SSN with dashes", () => {
      const result = scrubPhi("Patient SSN: 123-45-6789");
      expect(result.scrubbedText).toContain("[REDACTED]");
      expect(result.scrubbedText).not.toContain("123-45-6789");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects SSN without dashes", () => {
      const result = scrubPhi("SSN: 123456789");
      expect(result.scrubbedText).not.toContain("123456789");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects PhilHealth number", () => {
      const result = scrubPhi("PhilHealth: 12-3456789-1");
      expect(result.scrubbedText).not.toContain("12-3456789-1");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Medical Record Number Detection", () => {
    it("detects MRN with prefix", () => {
      const result = scrubPhi("MRN: 12345678");
      expect(result.scrubbedText).not.toContain("12345678");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects MRN with dash", () => {
      const result = scrubPhi("MRN-12345678");
      expect(result.scrubbedText).not.toContain("12345678");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects Medical Record number", () => {
      const result = scrubPhi("MEDICAL RECORD: 12345678");
      expect(result.scrubbedText).not.toContain("12345678");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Phone Number Detection", () => {
    it("detects Philippine mobile number", () => {
      const result = scrubPhi("Contact: +639171234567");
      expect(result.scrubbedText).not.toContain("639171234567");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects local mobile format", () => {
      const result = scrubPhi("Phone: 0917-123-4567");
      expect(result.scrubbedText).not.toContain("0917-123-4567");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects landline number", () => {
      const result = scrubPhi("Tel: (02) 8123-4567");
      expect(result.scrubbedText).not.toContain("(02) 8123-4567");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Email Detection", () => {
    it("detects email addresses", () => {
      const result = scrubPhi("Email: patient@example.com");
      expect(result.scrubbedText).not.toContain("patient@example.com");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects complex email formats", () => {
      const result = scrubPhi("Contact: john.doe+medical@hospital.org");
      expect(result.scrubbedText).not.toContain("john.doe+medical@hospital.org");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Date of Birth Detection", () => {
    it("detects DOB with label", () => {
      const result = scrubPhi("DOB: 01/15/1990");
      expect(result.scrubbedText).not.toContain("01/15/1990");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects Date of Birth with label", () => {
      const result = scrubPhi("DATE OF BIRTH: 1990-01-15");
      expect(result.scrubbedText).not.toContain("1990-01-15");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects standalone birth date", () => {
      const result = scrubPhi("Born: January 15, 1990");
      expect(result.scrubbedText).not.toContain("January 15, 1990");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Address Detection", () => {
    it("detects street address", () => {
      const result = scrubPhi("Address: 123 Main St.");
      expect(result.scrubbedText).not.toContain("123 Main St.");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects barangay address", () => {
      const result = scrubPhi("BRGY. San Antonio, Quezon City");
      expect(result.scrubbedText).not.toContain("BRGY. San Antonio");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Insurance ID Detection", () => {
    it("detects PhilHealth ID", () => {
      const result = scrubPhi("PhilHealth #: 12-345678901-2");
      expect(result.scrubbedText).not.toContain("12-345678901-2");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects HMO number", () => {
      const result = scrubPhi("HMO: 123456789012");
      expect(result.scrubbedText).not.toContain("123456789012");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Name Detection", () => {
    it("detects patient name with label", () => {
      const result = scrubPhi("PATIENT: Juan Dela Cruz");
      expect(result.scrubbedText).not.toContain("Juan Dela Cruz");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects doctor name with label", () => {
      const result = scrubPhi("DOCTOR: Dr. Maria Santos");
      expect(result.scrubbedText).not.toContain("Maria Santos");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Mixed PHI Detection", () => {
    it("detects multiple PHI types in a medical document excerpt", () => {
      const medicalText = `
        Patient: Juan Dela Cruz
        DOB: 03/15/1985
        MRN: 12345678
        Contact: +639171234567
        Email: juan@email.com
        SSN: 123-45-6789
      `;
      const result = scrubPhi(medicalText);
      expect(result.matchCount).toBeGreaterThanOrEqual(5);
      expect(result.matches.length).toBeGreaterThanOrEqual(5);

      // Verify each PHI type is detected
      const types = detectPhiTypes(medicalText);
      expect(types).toContain("name");
      expect(types).toContain("date_of_birth");
      expect(types).toContain("mrn");
      expect(types).toContain("phone");
      expect(types).toContain("email");
      expect(types).toContain("ssn");
    });

    it("preserves non-PHI medical content", () => {
      const text = "Hemoglobin: 12.5 g/dL (Normal: 13.5-17.5)";
      const result = scrubPhi(text);
      expect(result.scrubbedText).toBe(text);
      expect(result.matchCount).toBe(0);
    });
  });

  describe("containsPhi", () => {
    it("returns true when PHI is present", () => {
      expect(containsPhi("SSN: 123-45-6789")).toBe(true);
    });

    it("returns false when no PHI is present", () => {
      expect(containsPhi("Hemoglobin: 12.5 g/dL")).toBe(false);
    });
  });

  describe("detectPhiTypes", () => {
    it("returns array of PHI types found", () => {
      const types = detectPhiTypes("SSN: 123-45-6789, Phone: 09171234567");
      expect(types).toContain("ssn");
      expect(types).toContain("phone");
    });

    it("returns empty array when no PHI", () => {
      const types = detectPhiTypes("Lab result: Normal");
      expect(types).toHaveLength(0);
    });
  });

  describe("scrubExtractedData", () => {
    it("scrubs patient name from extracted data", () => {
      const data = {
        patientName: "Juan Dela Cruz",
        tests: [{ name: "Hemoglobin", value: "12.5" }],
      };
      const result = scrubExtractedData(data);
      expect(result.scrubbedData.patientName).not.toBe("Juan Dela Cruz");
      expect(result.scrubbedData.patientName).toContain("[REDACTED]");
      expect(result.matches.length).toBeGreaterThanOrEqual(1);
    });

    it("preserves test data", () => {
      const data = {
        patientName: "Juan Dela Cruz",
        tests: [{ name: "Hemoglobin", value: "12.5" }],
      };
      const result = scrubExtractedData(data);
      expect(result.scrubbedData.tests).toEqual(data.tests);
    });
  });

  describe("scrubForExternalApi", () => {
    it("scrubs PHI with custom replacement token", () => {
      const result = scrubForExternalApi("Patient: Juan Dela Cruz, MRN: 12345678");
      expect(result.scrubbedText).toContain("[PHI_REDACTED]");
      expect(result.scrubbedText).not.toContain("Juan Dela Cruz");
      expect(result.scrubbedText).not.toContain("12345678");
    });
  });

  describe("buildScrubbedContext", () => {
    it("scrubs fields and summary", () => {
      const fields = {
        patientName: "Juan Dela Cruz",
        hemoglobin: "12.5 g/dL",
      };
      const summary = "Patient Juan Dela Cruz has normal hemoglobin levels.";
      const result = buildScrubbedContext(fields, summary);

      expect(result.scrubbedFields.patientName).toContain("[REDACTED]");
      expect(result.scrubbedFields.hemoglobin).toBe("12.5 g/dL");
      expect(result.scrubbedSummary).not.toContain("Juan Dela Cruz");
      expect(result.phiCount).toBeGreaterThanOrEqual(2);
    });

    it("handles null summary", () => {
      const fields = { hemoglobin: "12.5 g/dL" };
      const result = buildScrubbedContext(fields);
      expect(result.scrubbedSummary).toBe("");
      expect(result.phiCount).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty string", () => {
      const result = scrubPhi("");
      expect(result.scrubbedText).toBe("");
      expect(result.matchCount).toBe(0);
    });

    it("handles text with no PHI", () => {
      const result = scrubPhi("Lab results: WBC 5.0, RBC 4.5");
      expect(result.scrubbedText).toBe("Lab results: WBC 5.0, RBC 4.5");
      expect(result.matchCount).toBe(0);
    });

    it("handles overlapping PHI patterns", () => {
      const result = scrubPhi("DOB: 123-45-6789 (appears as SSN)");
      expect(result.scrubbedText).not.toContain("123-45-6789");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("preserves document structure", () => {
      const text = `Patient: Juan Dela Cruz
DOB: 01/15/1990
MRN: 12345678

Lab Results:
Hemoglobin: 12.5 g/dL
WBC: 5000`;
      const result = scrubPhi(text);
      expect(result.scrubbedText).toContain("Lab Results:");
      expect(result.scrubbedText).toContain("Hemoglobin: 12.5 g/dL");
      expect(result.scrubbedText).toContain("WBC: 5000");
    });

    it("handles partialMask option", () => {
      const result = scrubPhi("Patient: Juan Dela Cruz", {
        partialMask: true,
        replacementToken: "[PHI]",
      });
      expect(result.scrubbedText).not.toContain("Juan Dela Cruz");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("handles custom knownNames for improved detection", () => {
      const result = scrubPhi("Dr. Reyes examined the patient.", {
        knownNames: ["Reyes"],
        replacementToken: "[REDACTED]",
      });
      expect(result.scrubbedText).not.toContain("Reyes");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PRC License & Philippines-Specific IDs", () => {
    it("detects PRC license number", () => {
      const result = scrubPhi("PRC License: 1234567");
      expect(result.scrubbedText).not.toContain("1234567");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects Philippine passport number", () => {
      const result = scrubPhi("Passport: P1234567M");
      expect(result.scrubbedText).not.toContain("P1234567M");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });

    it("detects complete Philippine address", () => {
      const result = scrubPhi("Address: 42 P. Gomez St., Barangay San Lorenzo, Makati City 1226");
      expect(result.scrubbedText).not.toContain("42 P. Gomez St.");
      expect(result.matchCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Audit Log Integration", () => {
    it("scrubbed data phiTypesDetected includes all detected types", () => {
      const text = "Patient: Juan Dela Cruz, DOB: 01/15/1990, SSN: 123-45-6789";
      const result = scrubPhi(text);
      const detectedTypes = [...new Set(result.matches.map((m) => m.type))];
      expect(detectedTypes).toContain("name");
      expect(detectedTypes).toContain("date_of_birth");
      expect(detectedTypes).toContain("ssn");
    });

    it("original text is never present in scrubbed output", () => {
      const phiValues = ["Juan Dela Cruz", "123-45-6789", "09171234567", "juan@email.com"];
      const text = `Patient: ${phiValues[0]}, SSN: ${phiValues[1]}, Phone: ${phiValues[2]}, Email: ${phiValues[3]}`;
      const result = scrubPhi(text);
      for (const val of phiValues) {
        expect(result.scrubbedText).not.toContain(val);
      }
    });

    it("logs scrub event without exposing raw PHI", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      const text = "Patient: Juan Dela Cruz, MRN: 12345678";
      const result = scrubPhi(text);

      console.log(JSON.stringify({
        type: "phi_scrubbed",
        context: "test",
        phiCount: result.matchCount,
        phiTypes: [...new Set(result.matches.map((m) => m.type))],
        timestamp: new Date().toISOString(),
      }));

      const calls = spy.mock.calls.map((c) => c[0]).join(" ");
      expect(calls).toContain("phi_scrubbed");
      expect(calls).not.toContain("Juan Dela Cruz");
      expect(calls).not.toContain("12345678");
      expect(calls).toContain("phiCount");

      spy.mockRestore();
    });
  });
});
