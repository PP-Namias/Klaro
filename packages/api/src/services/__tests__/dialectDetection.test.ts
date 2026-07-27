import { describe, expect, it } from "vitest";

import {
  adaptResponseToDialect,
  detectDialect,
  getMessageLanguage,
  simplifyLanguage,
} from "../dialectDetection";

describe("Dialect Detection", () => {
  describe("detectDialect", () => {
    it("detects English text", () => {
      const result = detectDialect("Patient Name: John Doe");
      expect(result.dialect).toBe("en");
    });

    it("detects Filipino text", () => {
      const result = detectDialect("Ang pangalan ng pasyente ay Juan");
      expect(result.dialect).toBe("fil");
    });

    it("detects Bisaya text", () => {
      const result = detectDialect("Nindot kaayo ang adlaw karon");
      expect(["bisaya", "fil"]).toContain(result.dialect);
    });

    it("detects Ilocano text", () => {
      const result = detectDialect("Ti nagan ti pasyente");
      expect(result.dialect).toBe("ilocano");
    });

    it("returns confidence score", () => {
      const result = detectDialect("Ang pangalan ng pasyente");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns alternative dialects", () => {
      const result = detectDialect("Ang pangalan ng pasyente");
      expect(result.alternativeDialects).toBeDefined();
    });
  });

  describe("adaptResponseToDialect", () => {
    it("adapts to Filipino", () => {
      const result = adaptResponseToDialect(
        "Your results show high sugar",
        "fil",
      );
      expect(result).toContain("Ang iyong mga resulta");
    });

    it("adapts to Bisaya", () => {
      const result = adaptResponseToDialect(
        "Your results show high sugar",
        "bisaya",
      );
      expect(result).toContain("Ang imong mga resulta");
    });

    it("adapts to Ilocano", () => {
      const result = adaptResponseToDialect(
        "Your results show high sugar",
        "ilocano",
      );
      expect(result).toContain("Dagiti resultam");
    });

    it("returns original for English", () => {
      const result = adaptResponseToDialect("Your results", "en");
      expect(result).toBe("Your results");
    });
  });

  describe("simplifyLanguage", () => {
    it("simplifies complex words", () => {
      expect(simplifyLanguage("however, the results")).toBe("but, the results");
      expect(simplifyLanguage("therefore, we recommend")).toBe(
        "so, we recommend",
      );
    });

    it("preserves simple text", () => {
      expect(simplifyLanguage("simple text")).toBe("simple text");
    });
  });

  describe("getMessageLanguage", () => {
    it("detects language from messages", () => {
      const messages = [
        { role: "user", content: "Ang aking mga resulta" },
        { role: "assistant", content: "Here are your results" },
      ];
      expect(getMessageLanguage(messages)).toBe("fil");
    });

    it("returns English for empty messages", () => {
      expect(getMessageLanguage([])).toBe("en");
    });
  });
});
