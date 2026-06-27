import { describe, expect, it } from "vitest";

import {
  generateTanongMoCard,
  formatTanongMoCard,
  validateTanongMoCard,
} from "../tanongMoCard";

describe("Tanong Mo Sa Doktor Card", () => {
  describe("generateTanongMoCard", () => {
    it("generates card for normal value", () => {
      const card = generateTanongMoCard("HGB", 14);
      expect(card.severity).toBe("normal");
      expect(card.questions.length).toBeGreaterThan(0);
      expect(card.bookingCta).toBe(false);
    });

    it("generates card for high value", () => {
      const card = generateTanongMoCard("GLU", 120);
      expect(card.severity).toBe("high");
      expect(card.bookingCta).toBe(true);
    });

    it("generates card for critical value", () => {
      const card = generateTanongMoCard("GLU", 300);
      expect(card.severity).toBe("critical");
      expect(card.bookingCta).toBe(true);
    });

    it("generates Filipino questions", () => {
      const card = generateTanongMoCard("HGB", 14, { language: "fil" });
      expect(card.questions[0]).toContain("Ano");
    });

    it("limits questions to maxQuestions", () => {
      const card = generateTanongMoCard("GLU", 300, { maxQuestions: 2 });
      expect(card.questions.length).toBe(2);
    });

    it("includes disclaimer", () => {
      const card = generateTanongMoCard("HGB", 14);
      expect(card.disclaimer).toContain("educational purposes");
    });

    it("includes Filipino disclaimer", () => {
      const card = generateTanongMoCard("HGB", 14, { language: "fil" });
      expect(card.disclaimer).toContain("pang-edukasyon");
    });
  });

  describe("formatTanongMoCard", () => {
    it("formats card for storage", () => {
      const card = generateTanongMoCard("HGB", 14);
      const formatted = formatTanongMoCard(card);

      expect(formatted.id).toBeDefined();
      expect(formatted.title).toBeDefined();
      expect(formatted.generatedAt).toBeDefined();
    });
  });

  describe("validateTanongMoCard", () => {
    it("returns no errors for valid card", () => {
      const card = generateTanongMoCard("HGB", 14);
      const errors = validateTanongMoCard(card);
      expect(errors).toHaveLength(0);
    });

    it("returns error for missing ID", () => {
      const card = generateTanongMoCard("HGB", 14);
      card.id = "";
      const errors = validateTanongMoCard(card);
      expect(errors.some((e) => e.includes("ID"))).toBe(true);
    });

    it("returns error for missing questions", () => {
      const card = generateTanongMoCard("HGB", 14);
      card.questions = [];
      const errors = validateTanongMoCard(card);
      expect(errors.some((e) => e.includes("question"))).toBe(true);
    });
  });
});
