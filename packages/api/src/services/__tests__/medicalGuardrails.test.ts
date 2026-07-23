import { describe, expect, it } from "vitest";

import {
  checkInputGuardrails,
  filterOutput,
  buildBlockedResponse,
  buildEducationalResponse,
  validateResponse,
  getDisclaimer,
  getDisclaimers,
} from "../medicalGuardrails";

describe("Medical Guardrails", () => {
  describe("checkInputGuardrails", () => {
    it("blocks diagnosis requests", () => {
      const result = checkInputGuardrails("What is my diagnosis?");
      expect(result.level).toBe("blocked");
      expect(result.reason).toBeDefined();
    });

    it("blocks medication advice requests", () => {
      const result = checkInputGuardrails("What medication should I take?");
      expect(result.level).toBe("blocked");
    });

    it("blocks treatment requests", () => {
      const result = checkInputGuardrails("Should I stop taking my medication?");
      expect(result.level).toBe("blocked");
    });

    it("blocks prognosis requests", () => {
      const result = checkInputGuardrails("How long do I have?");
      expect(result.level).toBe("blocked");
    });

    it("allows educational queries", () => {
      const result = checkInputGuardrails("What is hypertension?");
      expect(result.level).toBe("safe");
    });

    it("allows result explanation queries", () => {
      const result = checkInputGuardrails("What does this result mean?");
      expect(result.level).toBe("safe");
    });

    it("allows normal range queries", () => {
      const result = checkInputGuardrails("What are normal values for hemoglobin?");
      expect(result.level).toBe("safe");
    });
  });

  describe("filterOutput", () => {
    it("filters diagnostic statements", () => {
      const output = "Based on your results, you have diabetes.";
      const result = filterOutput(output);
      expect(result.level).toBe("filtered");
      expect(result.filteredContent).not.toContain("you have diabetes");
    });

    it("filters treatment advice", () => {
      const output = "You should take 500mg of metformin twice daily.";
      const result = filterOutput(output);
      expect(result.level).toBe("filtered");
      expect(result.filteredContent).not.toContain("500mg");
    });

    it("preserves safe content", () => {
      const output = "Your hemoglobin level is within normal range.";
      const result = filterOutput(output);
      expect(result.level).toBe("safe");
      expect(result.filteredContent).toContain("hemoglobin");
    });

    it("adds disclaimers to substantive responses", () => {
      const output = "This is a detailed explanation of your lab results that contains more than 100 characters to trigger the disclaimer addition logic.";
      const result = filterOutput(output);
      expect(result.filteredContent).toContain("educational purposes");
    });
  });

  describe("buildBlockedResponse", () => {
    it("returns blocked response in English", () => {
      const response = buildBlockedResponse("test query", "en");
      expect(response).toContain("consult your healthcare provider");
    });

    it("returns blocked response in Filipino", () => {
      const response = buildBlockedResponse("test query", "fil");
      expect(response).toContain("doktor");
    });
  });

  describe("buildEducationalResponse", () => {
    it("returns educational response", () => {
      const response = buildEducationalResponse("What is hypertension?", "en");
      expect(response).toContain("educational purposes");
    });
  });

  describe("validateResponse", () => {
    it("validates safe response", () => {
      const result = validateResponse("Your results are within normal range.");
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("detects diagnostic violations", () => {
      const result = validateResponse("You have cancer.");
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("detects treatment violations", () => {
      const result = validateResponse("You should take 100mg of aspirin.");
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe("getDisclaimer", () => {
    it("returns English disclaimer", () => {
      const disclaimer = getDisclaimer("en");
      expect(disclaimer).toContain("educational purposes");
    });

    it("returns Filipino disclaimer", () => {
      const disclaimer = getDisclaimer("fil");
      expect(disclaimer).toContain("pang-edukasyong");
    });

    it("falls back to English for unknown language", () => {
      const disclaimer = getDisclaimer("xyz");
      expect(disclaimer).toContain("educational purposes");
    });
  });

  describe("getDisclaimers", () => {
    it("returns all disclaimers", () => {
      const disclaimers = getDisclaimers();
      expect(disclaimers).toHaveProperty("en");
      expect(disclaimers).toHaveProperty("fil");
      expect(disclaimers).toHaveProperty("ceb");
      expect(disclaimers).toHaveProperty("ilo");
    });
  });
});
