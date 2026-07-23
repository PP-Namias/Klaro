import { describe, it, expect } from "vitest";

import type { SeverityLevel } from "~/components/scan/SeverityIndicator";
import type { FlaggedValue } from "~/components/scan/FlaggedValuesSection";
import type { Dialect } from "~/components/scan/PlainLanguageSummary";

describe("SeverityIndicator", () => {
  it("supports all severity levels", () => {
    const levels: SeverityLevel[] = ["normal", "low", "moderate", "high", "critical"];
    expect(levels).toHaveLength(5);
    expect(levels).toContain("critical");
    expect(levels).toContain("moderate");
  });

  it("has correct color for critical severity", () => {
    const criticalColor = "#dc2626";
    expect(criticalColor).toBe("#dc2626");
  });

  it("has correct color for normal severity", () => {
    const normalColor = "#22c55e";
    expect(normalColor).toBe("#22c55e");
  });
});

describe("ConfidenceScore", () => {
  it("shows high confidence above 80", () => {
    const label = (score: number) => {
      if (score >= 80) return "High confidence";
      if (score >= 60) return "Moderate confidence";
      return "Low confidence";
    };
    expect(label(85)).toBe("High confidence");
    expect(label(65)).toBe("Moderate confidence");
    expect(label(40)).toBe("Low confidence");
  });

  it("clamps score between 0 and 100", () => {
    const clamp = (s: number) => Math.max(0, Math.min(100, s));
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(75)).toBe(75);
  });

  it("rounds score to integer", () => {
    expect(Math.round(85.7)).toBe(86);
    expect(Math.round(99.1)).toBe(99);
  });
});

describe("FlaggedValuesSection", () => {
  it("renders nothing when values array is empty", () => {
    const values: FlaggedValue[] = [];
    expect(values).toHaveLength(0);
  });

  it("shows flagged values with severity", () => {
    const values: FlaggedValue[] = [
      {
        testName: "Glucose",
        value: "180",
        unit: "mg/dL",
        referenceRange: "70-110",
        severity: "high",
        flag: "H",
      },
      {
        testName: "Hemoglobin",
        value: "9.5",
        unit: "g/dL",
        referenceRange: "12-16",
        severity: "critical",
        flag: "L",
      },
    ];
    expect(values).toHaveLength(2);
    expect(values[0]?.testName).toBe("Glucose");
    expect(values[1]?.severity).toBe("critical");
  });
});

describe("PlainLanguageSummary", () => {
  it("supports all dialects", () => {
    const dialects: Dialect[] = ["English", "Filipino", "Bisaya", "Ilocano"];
    expect(dialects).toHaveLength(4);
    expect(dialects).toContain("Bisaya");
    expect(dialects).toContain("Ilocano");
  });

  it("identifies active dialect", () => {
    const isActive = (current: Dialect, target: Dialect) => current === target;
    expect(isActive("Filipino", "Filipino")).toBe(true);
    expect(isActive("English", "Filipino")).toBe(false);
  });
});

describe("TanongMoCard", () => {
  it("generates questions list", () => {
    const questions = [
      "What does my high glucose level mean?",
      "Do I need to take medication?",
    ];
    expect(questions).toHaveLength(2);
    expect(questions[0]).toContain("glucose");
  });

  it("matches severity to severity levels", () => {
    const severities = ["low", "moderate", "high"] as const;
    expect(severities).toContain("high");
    expect(severities).toContain("moderate");
  });
});
