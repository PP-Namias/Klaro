import { describe, it, assert } from "node:test";
import type { ExtractedTest } from "@klaro/validators/extraction";
import { computeSeverityForTests, generatePlainLanguageExplanation } from "../services/llm";

describe("LLM Service - Plain-language Explanation Generation", () => {
  describe("Severity Scoring", () => {
    it("should return LOW severity when no tests are flagged", () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "95", unit: "mg/dL", flagged: false },
      ];
      const severity = computeSeverityForTests(tests);
      assert.strictEqual(severity, "LOW");
    });

    it("should return MODERATE severity when 30-49% are flagged", () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "0.8", unit: "mg/dL", flagged: false },
      ];
      const severity = computeSeverityForTests(tests);
      assert.strictEqual(severity, "MODERATE");
    });

    it("should return HIGH severity when >=50% are flagged", () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "0.8", unit: "mg/dL", flagged: false },
      ];
      const severity = computeSeverityForTests(tests);
      assert.strictEqual(severity, "HIGH");
    });

    it("should handle empty test list", () => {
      const tests: ExtractedTest[] = [];
      const severity = computeSeverityForTests(tests);
      assert.strictEqual(severity, "LOW");
    });
  });

  describe("Plain-language Generation - Filipino", () => {
    it("should generate explanation for normal results", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "95", unit: "mg/dL", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.dialect, "Filipino");
      assert.strictEqual(result.severity, "LOW");
      assert(result.summary.length > 0, "Summary should not be empty");
      assert(result.summary.includes("normal"), "Should mention normal");
      assert.strictEqual(result.tests.length, 2, "Should have 2 test explanations");
      assert(!result.disclaimer, "Should not have disclaimer for LOW severity");
    });

    it("should generate explanation with disclaimer for HIGH severity", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "2.5", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.severity, "HIGH");
      assert(result.disclaimer, "Should have disclaimer for HIGH severity");
      assert(result.bookingPrompt, "Should have booking CTA for HIGH severity");
      assert(result.disclaimer.includes("⚠️"), "Disclaimer should include warning icon");
    });

    it("should generate tanqmo card with questions", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert(result.questionsForDoctor.length > 0, "Should have questions");
      assert(result.questionsForDoctor.length <= 5, "Should have max 5 questions");
      const allQuestionsInFilipino = result.questionsForDoctor.every((q) =>
        /[A-Za-z0-9\s\?\-\/\(\)]/i.test(q),
      );
      assert(allQuestionsInFilipino, "Questions should be in readable text");
    });

    it("should include test explanations", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.tests.length, 2);
      assert.strictEqual(result.tests[0].name, "Hemoglobin");
      assert.strictEqual(result.tests[0].value, "14");
      assert(result.tests[0].interpretation.length > 0);
      assert(!result.tests[0].recommendation, "Normal test should not have recommendation");
      assert(result.tests[1].recommendation, "Flagged test should have recommendation");
    });
  });

  describe("Plain-language Generation - Bisaya", () => {
    it("should generate Bisaya explanation", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "95", unit: "mg/dL", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Bisaya");

      assert.strictEqual(result.dialect, "Bisaya");
      assert(result.summary.length > 0);
      assert(result.tests.length === 2);
    });

    it("should have Bisaya disclaimer for HIGH severity", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "2.5", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Bisaya");

      assert.strictEqual(result.severity, "HIGH");
      assert(result.disclaimer);
    });
  });

  describe("Plain-language Generation - Ilocano", () => {
    it("should generate Ilocano explanation", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Ilocano");

      assert.strictEqual(result.dialect, "Ilocano");
      assert(result.summary.length > 0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single test result", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.tests.length, 1);
      assert(result.summary.length > 0);
    });

    it("should handle tests without units", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.tests.length, 1);
      assert.strictEqual(result.tests[0].value, "14");
    });

    it("should handle tests without reference ranges", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert(result.tests[0].interpretation.length > 0);
    });

    it("should handle mixed normal and abnormal results", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "0.8", unit: "mg/dL", flagged: false },
        { name: "Potassium", value: "6.5", unit: "mEq/L", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert.strictEqual(result.severity, "MODERATE");
      assert.strictEqual(result.tests.length, 4);
      const flaggedExplanations = result.tests.filter((t) => t.recommendation);
      assert.strictEqual(flaggedExplanations.length, 2);
    });
  });

  describe("Output Structure Validation", () => {
    it("should have all required LLM response fields", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert(result.summary);
      assert(result.tests);
      assert(result.questionsForDoctor);
      assert(result.severity);
      assert(["LOW", "MODERATE", "HIGH"].includes(result.severity));
    });

    it("should have properly structured tanqmo card fields in output", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert(result.questionsForDoctor.length > 0);
      assert(result.severity === "MODERATE" || result.severity === "HIGH");
    });

    it("should validate test explanation structure", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      result.tests.forEach((test) => {
        assert(test.name, "Test should have name");
        assert(test.interpretation, "Test should have interpretation");
        assert(typeof test.interpretation === "string");
      });
    });
  });

  describe("Accuracy Metrics", () => {
    it("should generate explanations for 95%+ of test combinations", async () => {
      const testCombos = [
        [{ name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false }],
        [
          { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
          { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        ],
        [
          { name: "Hemoglobin", value: "14", unit: "g/dL", flagged: false },
          { name: "Glucose", value: "95", unit: "mg/dL", flagged: false },
          { name: "Creatinine", value: "0.8", unit: "mg/dL", flagged: false },
        ],
      ];

      let successCount = 0;
      for (const combo of testCombos) {
        try {
          const result = await generatePlainLanguageExplanation(
            combo as ExtractedTest[],
            "Filipino",
          );
          assert(result.summary);
          successCount++;
        } catch {
          // Ignored
        }
      }

      const successRate = (successCount / testCombos.length) * 100;
      assert(successRate >= 95, `Success rate ${successRate}% should be >=95%`);
    });

    it("should maintain content within expected lengths", async () => {
      const tests: ExtractedTest[] = [
        { name: "Hemoglobin", value: "7", unit: "g/dL", flagged: true },
        { name: "Glucose", value: "350", unit: "mg/dL", flagged: true },
        { name: "Creatinine", value: "2.5", unit: "mg/dL", flagged: true },
      ];
      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      assert(
        result.summary.length <= 1000,
        "Summary should be <=1000 chars",
      );
      result.tests.forEach((test) => {
        assert(
          test.interpretation.length <= 200,
          `Interpretation for ${test.name} should be <=200 chars`,
        );
        if (test.recommendation) {
          assert(
            test.recommendation.length <= 150,
            `Recommendation should be <=150 chars`,
          );
        }
      });
    });
  });
});
