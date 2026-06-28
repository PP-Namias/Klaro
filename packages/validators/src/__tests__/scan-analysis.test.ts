import { describe, it, expect } from "vitest";
import {
  aiScanAnalysisSchema,
  analyzeScanInputSchema,
  scanUrgencySchema,
  scanLanguageSchema,
  scanStatusSchema,
  scanGuestInputSchema,
  scanGuestAnalysisSchema,
  scanGuestResponseSchema,
} from "../scan-analysis";

describe("aiScanAnalysisSchema", () => {
  it("accepts valid analysis", () => {
    const result = aiScanAnalysisSchema.safeParse({
      summary: "Results look normal",
      urgency: "LOW",
      recommendations: ["Continue monitoring"],
    });
    expect(result.success).toBe(true);
  });

  it("requires summary max 500 chars", () => {
    const result = aiScanAnalysisSchema.safeParse({
      summary: "a".repeat(501),
      urgency: "LOW",
      recommendations: ["Test"],
    });
    expect(result.success).toBe(false);
  });

  it("requires urgency LOW/MODERATE/HIGH", () => {
    const result = aiScanAnalysisSchema.safeParse({
      summary: "Summary",
      urgency: "CRITICAL",
      recommendations: ["Test"],
    });
    expect(result.success).toBe(false);
  });

  it("requires recommendations array min 1", () => {
    const result = aiScanAnalysisSchema.safeParse({
      summary: "Summary",
      urgency: "LOW",
      recommendations: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects recommendations over 3 items", () => {
    const result = aiScanAnalysisSchema.safeParse({
      summary: "Summary",
      urgency: "LOW",
      recommendations: ["R1", "R2", "R3", "R4"],
    });
    expect(result.success).toBe(false);
  });
});

describe("analyzeScanInputSchema", () => {
  it("accepts valid input with tests", () => {
    const result = analyzeScanInputSchema.safeParse({
      extractedTests: [{ name: "Glucose", value: "110" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional patientAge", () => {
    const result = analyzeScanInputSchema.safeParse({
      extractedTests: [],
      patientAge: 25,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional patientSex male", () => {
    const result = analyzeScanInputSchema.safeParse({
      extractedTests: [],
      patientSex: "male",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional patientSex female", () => {
    const result = analyzeScanInputSchema.safeParse({
      extractedTests: [],
      patientSex: "female",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional patientSex other", () => {
    const result = analyzeScanInputSchema.safeParse({
      extractedTests: [],
      patientSex: "other",
    });
    expect(result.success).toBe(true);
  });
});

describe("scanUrgencySchema", () => {
  it("accepts LOW", () => {
    expect(scanUrgencySchema.safeParse("LOW").success).toBe(true);
  });

  it("accepts MODERATE", () => {
    expect(scanUrgencySchema.safeParse("MODERATE").success).toBe(true);
  });

  it("accepts HIGH", () => {
    expect(scanUrgencySchema.safeParse("HIGH").success).toBe(true);
  });
});

describe("scanLanguageSchema", () => {
  it("accepts Filipino", () => {
    expect(scanLanguageSchema.safeParse("Filipino").success).toBe(true);
  });

  it("accepts English", () => {
    expect(scanLanguageSchema.safeParse("English").success).toBe(true);
  });
});

describe("scanStatusSchema", () => {
  it("accepts completed", () => {
    expect(scanStatusSchema.safeParse("completed").success).toBe(true);
  });

  it("accepts error", () => {
    expect(scanStatusSchema.safeParse("error").success).toBe(true);
  });
});

describe("scanGuestInputSchema", () => {
  const validBase64 = "A".repeat(100);

  it("accepts valid base64 image", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fileName", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
      fileName: "lab-result.png",
    });
    expect(result.success).toBe(true);
  });

  it("defaults language to English", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe("English");
    }
  });

  it("accepts optional patientAge", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
      patientAge: 30,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional patientSex", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
      patientSex: "female",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional facilityName", () => {
    const result = scanGuestInputSchema.safeParse({
      base64Image: validBase64,
      facilityName: "Manila Hospital",
    });
    expect(result.success).toBe(true);
  });
});

describe("scanGuestAnalysisSchema", () => {
  it("accepts valid analysis", () => {
    const result = scanGuestAnalysisSchema.safeParse({
      summary: "Results are normal",
      urgency: "LOW",
      recommendations: ["Follow up in 6 months"],
    });
    expect(result.success).toBe(true);
  });
});

describe("scanGuestResponseSchema", () => {
  it("accepts valid response", () => {
    const result = scanGuestResponseSchema.safeParse({
      requestId: "req-123",
      status: "completed",
      language: "English",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("requires requestId", () => {
    const result = scanGuestResponseSchema.safeParse({
      status: "completed",
      language: "English",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("requires timestamp as ISO datetime", () => {
    const result = scanGuestResponseSchema.safeParse({
      requestId: "req-123",
      status: "completed",
      language: "English",
      timestamp: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional source gemini", () => {
    const result = scanGuestResponseSchema.safeParse({
      requestId: "req-123",
      status: "completed",
      source: "gemini",
      language: "English",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional source fallback", () => {
    const result = scanGuestResponseSchema.safeParse({
      requestId: "req-123",
      status: "completed",
      source: "fallback",
      language: "English",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional source mock", () => {
    const result = scanGuestResponseSchema.safeParse({
      requestId: "req-123",
      status: "completed",
      source: "mock",
      language: "English",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});
