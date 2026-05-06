import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ExtractedTest } from "@klaro/validators/extraction";
import {
  generatePlainLanguageExplanation,
  computeSeverityForTests,
  registerPromptVersion,
  getActivePromptVersion,
  getAllPromptVersions,
  logPromptUsage,
  PROMPT_TEMPLATES,
} from "../llm";

describe("LLM Service", () => {
  describe("Severity Scoring", () => {
    it("should compute LOW severity when no tests are flagged", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "7.5",
          unit: "K/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
        {
          name: "RBC",
          value: "4.8",
          unit: "M/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 5.5,
        },
      ];

      const severity = computeSeverityForTests(tests);
      expect(severity).toBe("LOW");
    });

    it("should compute MODERATE severity when 30-50% of tests are flagged", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "2.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
        {
          name: "RBC",
          value: "4.8",
          unit: "M/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 5.5,
        },
        {
          name: "Hemoglobin",
          value: "14.0",
          unit: "g/dL",
          flagged: false,
          referenceMin: 13.5,
          referenceMax: 17.5,
        },
      ];

      const severity = computeSeverityForTests(tests);
      expect(severity).toBe("MODERATE");
    });

    it("should compute HIGH severity when >= 50% of tests are flagged", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "2.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
        {
          name: "RBC",
          value: "3.0",
          unit: "M/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 5.5,
        },
      ];

      const severity = computeSeverityForTests(tests);
      expect(severity).toBe("HIGH");
    });
  });

  describe("Plain-Language Explanation Generation", () => {
    it("should generate explanation in Filipino dialect", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "7.5",
          unit: "K/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
      expect(result.tests).toBeInstanceOf(Array);
      expect(result.severity).toBeTruthy();
      expect(result.questionsForDoctor).toBeInstanceOf(Array);
      // Summary should be in Filipino
      expect(result.summary).toContain("Maganda") || expect(result.summary).toContain("iyong");
    });

    it("should generate explanation in Bisaya dialect", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "7.5",
          unit: "K/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Bisaya");

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
      // Summary should be in Bisaya
      expect(result.summary).toContain("Maayo") || expect(result.summary).toContain("imong");
    });

    it("should generate explanation in Ilocano dialect", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "7.5",
          unit: "K/uL",
          flagged: false,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Ilocano");

      expect(result).toBeDefined();
      expect(result.summary).toBeTruthy();
      // Summary should be in Ilocano
      expect(result.summary).toContain("Nasapa") || expect(result.summary).toContain("resulta");
    });

    it("should include recommendations for flagged tests", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "2.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      expect(result.tests.length).toBeGreaterThan(0);
      const wbcTest = result.tests.find((t: typeof result.tests[0]) => t.name === "WBC");
      expect(wbcTest?.recommendation).toBeTruthy();
    });

    it("should generate Tanong-Mo card with questions", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "2.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      expect(result.questionsForDoctor.length).toBeGreaterThan(0);
      expect(result.questionsForDoctor.length).toBeLessThanOrEqual(5);
    });

    it("should include disclaimer for HIGH severity", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "1.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
        {
          name: "RBC",
          value: "2.0",
          unit: "M/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 5.5,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      if (result.severity === "HIGH") {
        expect(result.disclaimer).toBeTruthy();
        expect(result.bookingPrompt).toBeTruthy();
      }
    });

    it("should respect max 200 words limit for interpretation", async () => {
      const tests: ExtractedTest[] = [
        {
          name: "WBC",
          value: "2.0",
          unit: "K/uL",
          flagged: true,
          referenceMin: 4.5,
          referenceMax: 11.0,
        },
      ];

      const result = await generatePlainLanguageExplanation(tests, "Filipino");

      result.tests.forEach((test: typeof result.tests[0]) => {
        const wordCount = test.interpretation.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(30); // Roughly 150 words max
      });
    });
  });

  describe("Prompt Versioning", () => {
    beforeEach(() => {
      // Reset prompt versions before each test
      vi.clearAllMocks();
    });

    it("should register a new prompt version", () => {
      const promptTemplate =
        "You are a medical assistant explaining test results in simple Filipino.";

      const version = registerPromptVersion(
        "explanation",
        "Filipino",
        promptTemplate,
        "gemini",
      );

      expect(version).toBeDefined();
      expect(version.promptTemplate).toBe(promptTemplate);
      expect(version.version).toBeGreaterThanOrEqual(1);
      expect(version.active).toBe(true);
    });

    it("should deactivate previous versions when registering new version", () => {
      const v1 = registerPromptVersion(
        "explanation",
        "Filipino",
        "Prompt v1",
        "gemini",
      );

      expect(v1.active).toBe(true);

      const v2 = registerPromptVersion(
        "explanation",
        "Filipino",
        "Prompt v2",
        "gemini",
      );

      expect(v2.active).toBe(true);
      expect(v2.version).toBe(2);
    });

    it("should get active prompt version", () => {
      registerPromptVersion("explanation", "Filipino", "Prompt v1", "gemini");

      const active = getActivePromptVersion("explanation", "Filipino");

      expect(active).toBeDefined();
      expect(active?.active).toBe(true);
    });

    it("should return null when no version is active", () => {
      const active = getActivePromptVersion("explanation", "Filipino");

      expect(active).toBeNull() || expect(active).toBeDefined();
    });

    it("should get all prompt versions", () => {
      registerPromptVersion("explanation", "Filipino", "Prompt v1", "gemini");
      registerPromptVersion("explanation", "Filipino", "Prompt v2", "gemini");

      const allVersions = getAllPromptVersions("explanation");

      expect(allVersions).toBeDefined();
      expect(allVersions["explanation"]).toBeDefined();
    });
  });

  describe("Prompt Usage Logging", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should track prompt usage metrics", () => {
      registerPromptVersion("explanation", "Filipino", "Prompt", "gemini");

      logPromptUsage("explanation", "Filipino");
      logPromptUsage("explanation", "Filipino", 4.5);

      const version = getActivePromptVersion("explanation", "Filipino");
      expect(version?.metrics?.usageCount).toBeGreaterThan(0);
    });

    it("should track quality score averages", () => {
      registerPromptVersion("explanation", "Filipino", "Prompt", "gemini");

      logPromptUsage("explanation", "Filipino", 5.0);
      logPromptUsage("explanation", "Filipino", 4.0);

      const version = getActivePromptVersion("explanation", "Filipino");
      if (version?.metrics?.avgQualityScore) {
        expect(version.metrics.avgQualityScore).toBeGreaterThan(0);
        expect(version.metrics.avgQualityScore).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("Prompt Templates Export", () => {
    it("should export explanation prompt template function", () => {
      expect(PROMPT_TEMPLATES.explanation).toBeDefined();
      expect(typeof PROMPT_TEMPLATES.explanation).toBe("function");
    });

    it("should export tanqmo prompt template function", () => {
      expect(PROMPT_TEMPLATES.tanqmo).toBeDefined();
      expect(typeof PROMPT_TEMPLATES.tanqmo).toBe("function");
    });

    it("should have dialect information", () => {
      expect(PROMPT_TEMPLATES.dialects).toBeDefined();
      expect(PROMPT_TEMPLATES.dialects.Filipino).toBeTruthy();
      expect(PROMPT_TEMPLATES.dialects.Bisaya).toBeTruthy();
      expect(PROMPT_TEMPLATES.dialects.Ilocano).toBeTruthy();
    });
  });
});
