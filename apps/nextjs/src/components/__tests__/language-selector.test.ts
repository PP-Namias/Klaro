import { describe, expect, it } from "vitest";

import { LANGUAGE_OPTIONS, LANGUAGE_LABELS } from "@klaro/validators/language";

describe("LanguageSelector component (unit tests)", () => {
  describe("language options", () => {
    it("has 4 language options", () => {
      expect(LANGUAGE_OPTIONS).toHaveLength(4);
    });

    it("each option has code, name, and nativeName", () => {
      for (const opt of LANGUAGE_OPTIONS) {
        expect(opt).toHaveProperty("code");
        expect(opt).toHaveProperty("name");
        expect(opt).toHaveProperty("nativeName");
        expect(typeof opt.code).toBe("string");
        expect(typeof opt.name).toBe("string");
        expect(typeof opt.nativeName).toBe("string");
      }
    });

    it("includes English", () => {
      const en = LANGUAGE_OPTIONS.find((o) => o.code === "en");
      expect(en).toBeDefined();
      expect(en!.name).toBe("English");
      expect(en!.nativeName).toBe("English");
    });

    it("includes Filipino", () => {
      const fil = LANGUAGE_OPTIONS.find((o) => o.code === "fil");
      expect(fil).toBeDefined();
      expect(fil!.name).toBe("Filipino");
      expect(fil!.nativeName).toBe("Filipino");
    });

    it("includes Bisaya", () => {
      const ceb = LANGUAGE_OPTIONS.find((o) => o.code === "ceb");
      expect(ceb).toBeDefined();
      expect(ceb!.name).toBe("Bisaya");
      expect(ceb!.nativeName).toBe("Binisaya");
    });

    it("includes Ilocano", () => {
      const ilo = LANGUAGE_OPTIONS.find((o) => o.code === "ilo");
      expect(ilo).toBeDefined();
      expect(ilo!.name).toBe("Ilocano");
      expect(ilo!.nativeName).toBe("Ilokano");
    });
  });

  describe("flag emoji mapping", () => {
    it("has flag emojis for all languages", () => {
      const flags: Record<string, string> = {
        en: "🇺🇸",
        fil: "🇵🇭",
        ceb: "🇵🇭",
        ilo: "🇵🇭",
      };
      for (const opt of LANGUAGE_OPTIONS) {
        expect(flags[opt.code]).toBeDefined();
        expect(typeof flags[opt.code]).toBe("string");
      }
    });
  });

  describe("language labels", () => {
    it("has labels for all 4 languages", () => {
      expect(Object.keys(LANGUAGE_LABELS)).toHaveLength(4);
    });

    it("English label matches", () => {
      expect(LANGUAGE_LABELS.en.name).toBe("English");
      expect(LANGUAGE_LABELS.en.nativeName).toBe("English");
    });

    it("Filipino label matches", () => {
      expect(LANGUAGE_LABELS.fil.name).toBe("Filipino");
      expect(LANGUAGE_LABELS.fil.nativeName).toBe("Filipino");
    });

    it("Bisaya label matches", () => {
      expect(LANGUAGE_LABELS.ceb.name).toBe("Bisaya");
      expect(LANGUAGE_LABELS.ceb.nativeName).toBe("Binisaya");
    });

    it("Ilocano label matches", () => {
      expect(LANGUAGE_LABELS.ilo.name).toBe("Ilocano");
      expect(LANGUAGE_LABELS.ilo.nativeName).toBe("Ilokano");
    });
  });

  describe("component structure", () => {
    it("options can be found by code", () => {
      for (const code of ["en", "fil", "ceb", "ilo"]) {
        const opt = LANGUAGE_OPTIONS.find((o) => o.code === code);
        expect(opt).toBeDefined();
      }
    });

    it("no duplicate codes", () => {
      const codes = LANGUAGE_OPTIONS.map((o) => o.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("all codes are lowercase 2-3 letter codes", () => {
      for (const opt of LANGUAGE_OPTIONS) {
        expect(opt.code).toMatch(/^[a-z]{2,3}$/);
      }
    });
  });
});
