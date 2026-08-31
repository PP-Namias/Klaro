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

  it("leaves referenceRange undefined when the line carries none", () => {
    const [test] = extractTestsFromText("Sodium: 140");

    expect(test?.value).toBe("140");
    expect(test?.referenceRange).toBeUndefined();
    expect(test?.flagged).toBe(false);
  });
});
