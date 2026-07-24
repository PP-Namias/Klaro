import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildBookingSuggestion,
  buildSafetyDisclaimer,
  filterContent,
  getChatSafetyLevel,
  isHealthInformationQuery,
  isMedicalAdviceRequest,
  sanitizeInput,
  shouldSuggestBooking,
  validateMessageLength,
} from "../chatSafety";

describe("Chat Safety", () => {
  describe("filterContent", () => {
    it("allows health information queries", () => {
      const result = filterContent("What is hypertension?");
      expect(result.level).toBe("safe");
    });

    it("blocks prescription requests", () => {
      const result = filterContent("Prescribe me medication for my headache");
      expect(result.level).toBe("blocked");
    });

    it("blocks diagnosis requests", () => {
      const result = filterContent("What is my diagnosis?");
      expect(result.level).toBe("blocked");
    });

    it("blocks medication advice", () => {
      const result = filterContent("What medication should I take?");
      expect(result.level).toBe("blocked");
    });

    it("flags concerning questions", () => {
      const result = filterContent("How bad is my condition?");
      expect(result.level).toBe("caution");
    });

    it("flags fear-based questions", () => {
      const result = filterContent("Will I die from this?");
      expect(result.level).toBe("caution");
    });
  });

  describe("getChatSafetyLevel", () => {
    it("returns safe for normal queries", () => {
      expect(getChatSafetyLevel("Tell me about my results")).toBe("safe");
    });

    it("returns blocked for prescription requests", () => {
      expect(getChatSafetyLevel("Give me a prescription")).toBe("blocked");
    });
  });

  describe("buildSafetyDisclaimer", () => {
    it("returns disclaimer text", () => {
      const disclaimer = buildSafetyDisclaimer();
      expect(disclaimer).toContain("educational purposes");
      expect(disclaimer).toContain("consult");
    });
  });

  describe("shouldSuggestBooking", () => {
    it("returns true for high severity", () => {
      expect(shouldSuggestBooking("high")).toBe(true);
    });

    it("returns true for critical severity", () => {
      expect(shouldSuggestBooking("critical")).toBe(true);
    });

    it("returns false for normal severity", () => {
      expect(shouldSuggestBooking("normal")).toBe(false);
    });
  });

  describe("buildBookingSuggestion", () => {
    it("returns suggestion text", () => {
      const suggestion = buildBookingSuggestion();
      expect(suggestion).toContain("consult");
      expect(suggestion).toContain("doctor");
    });
  });

  describe("validateMessageLength", () => {
    it("returns no errors for valid message", () => {
      expect(validateMessageLength("Hello")).toHaveLength(0);
    });

    it("returns error for too long message", () => {
      const errors = validateMessageLength("a".repeat(2001));
      expect(errors.some((e) => e.includes("too long"))).toBe(true);
    });

    it("returns error for empty message", () => {
      const errors = validateMessageLength("  ");
      expect(errors.some((e) => e.includes("empty"))).toBe(true);
    });
  });

  describe("sanitizeInput", () => {
    it("escapes HTML characters", () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toContain("&lt;");
      expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain(
        "<script>",
      );
    });

    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });
  });

  describe("isMedicalAdviceRequest", () => {
    it("identifies medication questions", () => {
      expect(isMedicalAdviceRequest("What medication should I take?")).toBe(
        true,
      );
    });

    it("identifies dosage questions", () => {
      expect(isMedicalAdviceRequest("What is the dosage for this?")).toBe(true);
    });

    it("returns false for general questions", () => {
      expect(isMedicalAdviceRequest("What is my name?")).toBe(false);
    });
  });

  describe("isHealthInformationQuery", () => {
    it("identifies health information queries", () => {
      expect(isHealthInformationQuery("What is hypertension?")).toBe(true);
      expect(isHealthInformationQuery("Explain my results")).toBe(true);
    });

    it("returns false for non-health queries", () => {
      expect(isHealthInformationQuery("What time is it?")).toBe(false);
    });
  });
});
