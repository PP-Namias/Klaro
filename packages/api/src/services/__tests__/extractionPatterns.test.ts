import { describe, expect, it } from "vitest";

import { extractTestsFromText } from "../extraction";

/**
 * The extraction loop assumed every layout pattern exposed four capture groups.
 * The "TestName: value (range)" pattern has only three, so its reference range
 * was written into `unit`, `referenceRange` stayed undefined, and computeFlag
 * never ran — abnormal values silently came back unflagged.
 */
describe("extractTestsFromText capture-group mapping", () => {
  it("maps a value-only line's parenthesised range to referenceRange, not unit", () => {
    const [test] = extractTestsFromText(
      "Platelet Count: 95000 (150000-400000)",
    );

    expect(test?.value).toBe("95000");
    expect(test?.unit ?? "").toBe("");
    expect(test?.referenceRange).toBe("150000-400000");
    expect(test?.flagged).toBe(true);
  });

  it("still maps unit and range for a line that carries both", () => {
    const [test] = extractTestsFromText("Hemoglobin: 10.2 g/dL (12.0-16.0)");

    expect(test?.value).toBe("10.2");
    expect(test?.unit).toBe("g/dL");
    expect(test?.referenceRange).toBe("12.0-16.0");
    expect(test?.flagged).toBe(true);
  });

  it("handles the colon-less layout", () => {
    const [test] = extractTestsFromText("Creatinine 1.1 mg/dL (0.6-1.2)");

    expect(test?.value).toBe("1.1");
    expect(test?.unit).toBe("mg/dL");
    expect(test?.referenceRange).toBe("0.6-1.2");
    expect(test?.flagged).toBe(false);
  });

  it("handles the tab-separated layout", () => {
    const [test] = extractTestsFromText("Glucose\t142\tmg/dL\t70-100");

    expect(test?.value).toBe("142");
    expect(test?.unit).toBe("mg/dL");
    expect(test?.referenceRange).toBe("70-100");
    expect(test?.flagged).toBe(true);
  });

  it("falls back to the built-in range when the line carries none", () => {
    const [test] = extractTestsFromText("Sodium: 140");

    expect(test?.value).toBe("140");
    // Sodium has a built-in range, so the value is still checked.
    expect(test?.referenceRange).toBe("136-145");
    expect(test?.flagged).toBe(false);
  });
});

describe("extractTestsFromText PHI allowlist", () => {
  it("does not treat patient identifiers as lab results", () => {
    const results = extractTestsFromText(
      [
        "Patient ID: 12345",
        "Age: 45",
        "Room No: 302",
        "Contact: 09171234567",
        "Hemoglobin: 11.2 g/dL (12.0-16.0)",
      ].join("\n"),
    );

    // Only the real analyte survives; the identifiers are not measurements.
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toMatch(/hemoglobin/i);
  });

  it("still recognises analytes written under an alias", () => {
    const results = extractTestsFromText(
      ["HGB: 11.2 g/dL (12.0-16.0)", "FBS: 142 mg/dL (70-100)"].join("\n"),
    );

    expect(results.length).toBeGreaterThanOrEqual(1);
    for (const test of results) {
      expect(test.value).toBeTruthy();
    }
  });
});

describe("extractTestsFromText built-in reference ranges", () => {
  it("flags an abnormal value even when the document prints no range", () => {
    const [test] = extractTestsFromText("Hemoglobin: 9.1 g/dL");

    // 9.1 is below the unified HGB low of 12.
    expect(test?.flagged).toBe(true);
    expect(test?.referenceRange).toBe("12-17.5");
  });

  it("does not flag a normal value without a printed range", () => {
    const [test] = extractTestsFromText("Creatinine: 1.0 mg/dL");

    expect(test?.flagged).toBe(false);
    expect(test?.referenceRange).toBe("0.6-1.2");
  });

  it("prefers the range printed on the document over the built-in one", () => {
    const [test] = extractTestsFromText("Hemoglobin: 11.0 g/dL (10.5-15.0)");

    expect(test?.referenceRange).toBe("10.5-15.0");
    expect(test?.flagged).toBe(false);
  });

  it("leaves an unknown-range analyte unflagged rather than guessing", () => {
    const [test] = extractTestsFromText("Hemoglobin A1C: 7.4");

    expect(test?.referenceRange).toBeUndefined();
    expect(test?.flagged).toBe(false);
  });
});

describe("calculateSeverity bands", () => {
  it("returns borderline for a value just outside the range", async () => {
    const { calculateSeverity } = await import("../severityScoring");

    // General HGB band is 12-17.5; 11.5 is within 10% below the low bound.
    expect(calculateSeverity("HGB", 11.5).severity).toBe("borderline");
    // 18.5 is within 10% above the high bound.
    expect(calculateSeverity("HGB", 18.5).severity).toBe("borderline");
  });

  it("still separates normal, high and critical", async () => {
    const { calculateSeverity } = await import("../severityScoring");

    expect(calculateSeverity("HGB", 14).severity).toBe("normal");
    expect(calculateSeverity("HGB", 10.5).severity).toBe("high");
    expect(calculateSeverity("HGB", 5).severity).toBe("critical");
    expect(calculateSeverity("HGB", 24).severity).toBe("critical");
  });
});

describe("Philippine lab panel coverage", () => {
  it("carries at least 200 recognised aliases", async () => {
    const { CANONICAL_TEST_NAMES } = await import("../extraction");

    expect(Object.keys(CANONICAL_TEST_NAMES).length).toBeGreaterThanOrEqual(
      200,
    );
  });

  it("recognises urinalysis lines", () => {
    const results = extractTestsFromText(
      ["Specific Gravity: 1.020", "Pus Cells: 5-10 /hpf"].join("\n"),
    );

    const names = results.map((r) => r.name);
    expect(names).toContain("Specific Gravity");
    expect(names).toContain("Pus Cells");
    expect(results.find((r) => r.name === "Pus Cells")?.value).toBe("5-10");
  });

  it("recognises qualitative fecalysis lines", () => {
    const results = extractTestsFromText(
      ["Occult Blood: Positive", "Stool Consistency: Formed"].join("\n"),
    );

    const names = results.map((r) => r.name);
    expect(names).toContain("Occult Blood");
    expect(results.find((r) => r.name === "Occult Blood")?.value).toBe(
      "Positive",
    );
  });

  it("canonicalizes panel aliases to one display name", () => {
    const results = extractTestsFromText(
      ["SGPT: 68 U/L", "Segmenters: 72 %", "FBS: 142 mg/dL"].join("\n"),
    );

    const names = results.map((r) => r.name);
    expect(names).toContain("ALT");
    expect(names).toContain("Neutrophils");
    expect(names).toContain("Fasting Blood Glucose");
  });
});

describe("extractTestsFromText per-value confidence", () => {
  it("attaches a 0..1 confidence to every extracted row", () => {
    const results = extractTestsFromText(
      [
        "Hemoglobin: 11.2 g/dL (12.0-16.0)",
        "Occult Blood: Positive",
        "Sodium: 140",
      ].join("\n"),
    );

    expect(results.length).toBeGreaterThan(0);
    for (const test of results) {
      expect(typeof test.confidence).toBe("number");
      expect(test.confidence!).toBeGreaterThanOrEqual(0);
      expect(test.confidence!).toBeLessThanOrEqual(1);
    }
  });

  it("scores a fully-specified canonical line above a bare qualitative one", () => {
    const [full] = extractTestsFromText("Hemoglobin: 11.2 g/dL (12.0-16.0)");
    const [sparse] = extractTestsFromText("Occult Blood: Positive");

    expect(full!.confidence!).toBeGreaterThan(sparse!.confidence!);
  });

  it("scores a printed range above a built-in fallback range", () => {
    const [printed] = extractTestsFromText("Sodium: 140 mEq/L (136-145)");
    const [builtIn] = extractTestsFromText("Sodium: 140 mEq/L");

    expect(printed!.confidence!).toBeGreaterThan(builtIn!.confidence!);
  });

  it("still parses rows that carry no confidence field", async () => {
    const { ExtractedTestSchema } = await import(
      "@klaro/validators/extraction"
    );

    expect(
      ExtractedTestSchema.parse({ name: "Hemoglobin", value: "11.2" }),
    ).toMatchObject({ name: "Hemoglobin" });
    expect(
      ExtractedTestSchema.parse({
        name: "Hemoglobin",
        value: "11.2",
        confidence: 0.9,
      }).confidence,
    ).toBe(0.9);
  });
});
