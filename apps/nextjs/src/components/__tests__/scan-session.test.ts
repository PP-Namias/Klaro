/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";

import {
  clearScanAnalysisSession,
  normalizeScanAnalysisSession,
  readScanAnalysisSession,
  saveScanAnalysisSession,
} from "../scan-session";

describe("scan session normalization", () => {
  beforeEach(() => {
    clearScanAnalysisSession();
  });

  it("defaults to pending when payload has no result content", () => {
    const normalized = normalizeScanAnalysisSession({
      requestId: "scan-empty",
      status: "unknown",
    });

    expect(normalized.status).toBe("pending");
    expect(normalized.urgency).toBe("MODERATE");
  });

  it("normalizes invalid urgency/language and trims recommendations", () => {
    const normalized = normalizeScanAnalysisSession({
      requestId: "scan-1",
      status: "completed",
      language: "Tagalog",
      urgency: "SEVERE",
      recommendations: ["  first step  ", "", "second", "third", "fourth"],
      plainLanguageSummary: "Summary",
    });

    expect(normalized.language).toBeUndefined();
    expect(normalized.urgency).toBe("MODERATE");
    expect(normalized.recommendations).toEqual(["first step", "second", "third"]);
  });

  it("keeps the normalized output envelope stable for scan results", () => {
    const normalized = normalizeScanAnalysisSession({
      requestId: "scan-output",
      status: "completed",
      language: "English",
      extractedData: {
        patientAge: 45,
        facilityName: "Klaro Clinic",
        flaggedTests: [{ name: "Glucose", value: "210", flagged: true }],
      },
      plainLanguageSummary: "Your scan shows elevated values that need review.",
      urgency: "HIGH",
      recommendations: ["Seek urgent review", "Bring the scan report"],
      confidence: 0.91,
      warnings: ["fallback_used"],
    });

    expect(normalized.status).toBe("completed");
    expect(normalized.language).toBe("English");
    expect(normalized.analysis).toEqual({
      summary: "Your scan shows elevated values that need review.",
      urgency: "HIGH",
      recommendations: ["Seek urgent review", "Bring the scan report"],
    });
    expect(normalized.confidence).toBe(0.91);
    expect(normalized.warnings).toEqual(["fallback_used"]);
  });

  it("persists and restores session payload", () => {
    saveScanAnalysisSession({
      requestId: "scan-persist",
      status: "completed",
      language: "English",
      plainLanguageSummary: "Done",
      urgency: "LOW",
      recommendations: ["Keep records"],
      confidence: 0.8,
    });

    const restored = readScanAnalysisSession();

    expect(restored).toBeTruthy();
    expect(restored?.requestId).toBe("scan-persist");
    expect(restored?.status).toBe("completed");
    expect(restored?.analysis?.summary).toBe("Done");
  });
});
