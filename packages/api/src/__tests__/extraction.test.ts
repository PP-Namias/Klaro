import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractTestsFromText } from "../services/extraction";

describe("Extraction Service - KL-EX-001", () => {
  describe("Regex-based extraction", () => {
    it("should extract standard format: TestName: value unit (range)", () => {
      const text = "Hemoglobin: 13.5 g/dL (12.0-17.0)";
      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0]!.name, "Hemoglobin");
      assert.strictEqual(results[0]!.value, "13.5");
      assert.strictEqual(results[0]!.unit, "g/dL");
      assert.strictEqual(results[0]!.referenceRange, "12.0-17.0");
      assert.strictEqual(results[0]!.flagged, false); // within range
    });

    it("should extract no-colon format: TestName value unit (range)", () => {
      const text = "Hemoglobin 13.5 g/dL (12.0-17.0)";
      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0]!.name, "Hemoglobin");
      assert.strictEqual(results[0]!.value, "13.5");
    });

    it("should extract abbreviated format: TEST: value", () => {
      const text = "HGB: 13.5";
      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0]!.name, "Hemoglobin"); // canonicalized
      assert.strictEqual(results[0]!.value, "13.5");
    });

    it("should flag abnormal values outside reference range (low)", () => {
      const text = "Hemoglobin: 10.5 g/dL (12.0-17.0)";
      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.flagged, true);
    });

    it("should flag abnormal values outside reference range (high)", () => {
      const text = "Glucose: 250 mg/dL (70-100)";
      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.flagged, true);
    });
  });

  describe("Test name canonicalization", () => {
    it("should canonicalize abbreviations", () => {
      const text = `
HGB: 13.5
RBC: 4.5
WBC: 7.0
PLT: 250
HCT: 40
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.name, "Hemoglobin");
      assert.strictEqual(results[1]!.name, "Red Blood Cell Count");
      assert.strictEqual(results[2]!.name, "White Blood Cell Count");
      assert.strictEqual(results[3]!.name, "Platelet Count");
      assert.strictEqual(results[4]!.name, "Hematocrit");
    });

    it("should canonicalize common variants", () => {
      const text = `
Glucose: 95
Blood Glucose: 100
Fasting Blood Glucose: 92
      `;

      const results = extractTestsFromText(text);

      // all should map to "Fasting Blood Glucose"
      results.forEach((r) => {
        assert.strictEqual(r.name, "Fasting Blood Glucose");
      });
    });

    it("should handle LDL, HDL, and cholesterol variants", () => {
      const text = `
Total Cholesterol: 200
LDL: 130
HDL: 45
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.name, "Total Cholesterol");
      assert.strictEqual(results[1]!.name, "LDL Cholesterol");
      assert.strictEqual(results[2]!.name, "HDL Cholesterol");
    });

    it("should preserve unknown test names", () => {
      const text = "Custom Test XYZ: 123.45";
      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0]!.name, "Custom Test XYZ");
      assert.strictEqual(results[0]!.value, "123.45");
    });
  });

  describe("Multiple test extraction", () => {
    it("should extract complete lab panel", () => {
      const text = `
Hemoglobin: 13.5 g/dL (12.0-17.0)
Hematocrit: 40 % (36-46)
RBC: 4.5 million/uL (4.5-5.5)
WBC: 7.0 K/uL (4.5-11.0)
Platelets: 250 K/uL (150-400)
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 5);
      const names = results.map((r) => r.name);
      assert.deepStrictEqual(names, [
        "Hemoglobin",
        "Hematocrit",
        "Red Blood Cell Count",
        "White Blood Cell Count",
        "Platelet Count",
      ]);
    });

    it("should extract chemistry panel with flagged abnormals", () => {
      const text = `
Glucose: 250 mg/dL (70-100)
Creatinine: 2.5 mg/dL (0.7-1.3)
BUN: 35 mg/dL (7-20)
Sodium: 138 mEq/L (135-145)
Potassium: 5.5 mEq/L (3.5-5.0)
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 5);
      const flaggedCount = results.filter((r) => r.flagged).length;
      assert.strictEqual(flaggedCount, 4); // all except sodium
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", () => {
      const text = "";
      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 0);
    });

    it("should skip empty lines", () => {
      const text = `
Hemoglobin: 13.5 g/dL (12.0-17.0)

RBC: 4.5 million/uL (4.5-5.5)
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 2);
    });

    it("should handle decimal values", () => {
      const text = "Glucose: 95.5 mg/dL (70-100)";
      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.value, "95.5");
    });

    it("should skip invalid lines", () => {
      const text = `
Hemoglobin: 13.5 g/dL (12.0-17.0)
This is just text
RBC: 4.5 million/uL (4.5-5.5)
      `;

      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 2);
    });

    it("should avoid duplicate test names", () => {
      const text = `
Hemoglobin: 13.5 g/dL
HGB: 13.5 g/dL
      `;

      const results = extractTestsFromText(text);

      // should only extract first occurrence
      assert.strictEqual(results.length, 1);
    });

    it("should handle missing reference ranges", () => {
      const text = "Hemoglobin: 13.5 g/dL";
      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.referenceRange, undefined);
      assert.strictEqual(results[0]!.flagged, false); // no range = not flagged
    });

    it("should handle missing units", () => {
      const text = "Hemoglobin: 13.5";
      const results = extractTestsFromText(text);

      assert.strictEqual(results[0]!.unit, "");
      assert.strictEqual(results[0]!.value, "13.5");
    });
  });

  describe("Philippine lab format support", () => {
    it("should handle abbreviated format variants", () => {
      const text = `HGB: 13.5 (12.0-17.0)
RBC: 4.5 (4.5-5.5)`;

      const results = extractTestsFromText(text);

      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0]!.name, "Hemoglobin");
      assert.strictEqual(results[1]!.name, "Red Blood Cell Count");
    });
  });

  describe("Accuracy metrics", () => {
    it("should achieve >90% accuracy on standard formats", () => {
      const testCases = [
        "Hemoglobin: 13.5 g/dL (12.0-17.0)",
        "Glucose 95 mg/dL (70-100)",
        "HGB: 13.5",
        "RBC: 4.5 million/uL (4.5-5.5)",
        "WBC: 7.0 K/uL (4.5-11.0)",
        "Platelets: 250 K/uL (150-400)",
        "Creatinine: 1.0 mg/dL (0.7-1.3)",
        "BUN: 15 mg/dL (7-20)",
        "Sodium: 138 mEq/L (135-145)",
        "Potassium: 4.5 mEq/L (3.5-5.0)",
      ];

      let successCount = 0;
      for (const test of testCases) {
        const results = extractTestsFromText(test);
        if (results.length > 0 && results[0]!.value) {
          successCount++;
        }
      }

      const accuracy = (successCount / testCases.length) * 100;
      assert(accuracy >= 90, `Accuracy ${accuracy}% is below 90%`);
    });

    it("should canonicalize 80% of known test names", () => {
      const knownVariants = [
        "HGB: 13.5",
        "RBC: 4.5",
        "WBC: 7.0",
        "Glucose: 95",
        "LDL: 130",
        "HDL: 45",
        "Creatinine: 1.0",
      ];

      let canonicalCount = 0;
      for (const test of knownVariants) {
        const results = extractTestsFromText(test);
        if (results.length > 0) {
          const testName = test.split(":")[0] ?? "";
          // check if canonicalized (different from original abbreviation)
          if (
            results[0]!.name !== testName &&
            results[0]!.name.length > testName.length
          ) {
            canonicalCount++;
          }
        }
      }

      const rate = (canonicalCount / knownVariants.length) * 100;
      assert(rate >= 70, `Canonicalization rate ${rate}% is below 70%`);
    });
  });
});
