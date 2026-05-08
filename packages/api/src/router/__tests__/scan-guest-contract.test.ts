import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  scanGuestInputSchema,
  scanGuestResponseSchema,
} from "@klaro/validators/scan-analysis";

describe("scan guest contract", () => {
  it("accepts valid guest scan input", () => {
    const input = scanGuestInputSchema.parse({
      base64Image: Buffer.from("valid image bytes for test")
        .toString("base64")
        .repeat(8),
      fileName: "scan.png",
      language: "English",
      patientAge: 42,
      patientSex: "female",
      facilityName: "Test Clinic",
    });

    assert.equal(input.language, "English");
    assert.equal(input.patientAge, 42);
  });

  it("rejects malformed base64 input", () => {
    assert.throws(
      () =>
        scanGuestInputSchema.parse({
          base64Image: "***not-base64***",
          language: "English",
        }),
      Error,
    );
  });

  it("accepts normalized completed response contract", () => {
    const response = scanGuestResponseSchema.parse({
      requestId: "scan-123",
      status: "completed",
      source: "gemini",
      language: "English",
      analysis: {
        summary: "Summary text",
        urgency: "MODERATE",
        recommendations: ["Schedule a follow-up appointment"],
      },
      plainLanguageSummary: "Summary text",
      urgency: "MODERATE",
      recommendations: ["Schedule a follow-up appointment"],
      confidence: 0.91,
      extractedData: { glucose: { value: "210", flagged: true } },
      warnings: [],
      timestamp: new Date().toISOString(),
    });

    assert.equal(response.status, "completed");
    assert.equal(response.analysis?.urgency, "MODERATE");
  });

  it("rejects out-of-range confidence", () => {
    assert.throws(
      () =>
        scanGuestResponseSchema.parse({
          requestId: "scan-123",
          status: "completed",
          language: "English",
          confidence: 1.5,
          timestamp: new Date().toISOString(),
        }),
      Error,
    );
  });
});
