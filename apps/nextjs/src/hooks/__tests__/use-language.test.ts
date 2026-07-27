import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTranslation, t } from "~/i18n";

const mockStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
  key: (index: number) => Object.keys(mockStorage)[index] ?? null,
});

describe("useLanguage hook (unit tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("translation function t()", () => {
    it("returns correct English translation", () => {
      const result = t("en", "scan.title");
      expect(result).toContain("Scan");
    });

    it("returns correct Filipino translation", () => {
      const result = t("fil", "scan.title");
      expect(result).toContain("I-scan");
    });

    it("returns correct Bisaya translation", () => {
      const result = t("ceb", "scan.title");
      expect(result).toContain("I-scan");
    });

    it("returns correct Ilocano translation", () => {
      const result = t("ilo", "scan.title");
      expect(result).toContain("I-scan");
    });

    it("returns the key itself for missing translations", () => {
      const result = t("en", "nonexistent.key.here");
      expect(result).toBe("nonexistent.key.here");
    });

    it("interpolates parameters", () => {
      const result = t("en", "btn.scanFiles", { count: 5 });
      expect(result).toContain("5");
    });

    it("falls back to English for unknown language", () => {
      const result = t("xx" as any, "scan.title");
      expect(result).toContain("Scan");
    });
  });

  describe("getTranslation()", () => {
    it("returns English dictionary for 'en'", () => {
      const dict = getTranslation("en");
      expect(dict["scan.title"]).toBeDefined();
      expect(typeof dict["scan.title"]).toBe("string");
    });

    it("returns Filipino dictionary for 'fil'", () => {
      const dict = getTranslation("fil");
      expect(dict["scan.title"]).toBeDefined();
    });

    it("returns Bisaya dictionary for 'ceb'", () => {
      const dict = getTranslation("ceb");
      expect(dict["scan.title"]).toBeDefined();
    });

    it("returns Ilocano dictionary for 'ilo'", () => {
      const dict = getTranslation("ilo");
      expect(dict["scan.title"]).toBeDefined();
    });

    it("falls back to English for unknown language", () => {
      const dict = getTranslation("xx" as any);
      const enDict = getTranslation("en");
      expect(dict["scan.title"]).toBe(enDict["scan.title"]);
    });
  });

  describe("localStorage persistence", () => {
    it("can store and retrieve language preference", () => {
      localStorage.setItem("klaro-language", "ceb");
      expect(localStorage.getItem("klaro-language")).toBe("ceb");
    });

    it("clears language preference", () => {
      localStorage.setItem("klaro-language", "ilo");
      localStorage.removeItem("klaro-language");
      expect(localStorage.getItem("klaro-language")).toBeNull();
    });
  });

  describe("translation dictionary completeness", () => {
    it("all dictionaries have the same keys", () => {
      const en = getTranslation("en");
      const fil = getTranslation("fil");
      const ceb = getTranslation("ceb");
      const ilo = getTranslation("ilo");

      const enKeys = Object.keys(en).sort();
      expect(Object.keys(fil).sort()).toEqual(enKeys);
      expect(Object.keys(ceb).sort()).toEqual(enKeys);
      expect(Object.keys(ilo).sort()).toEqual(enKeys);
    });

    it("has scan-related keys", () => {
      const en = getTranslation("en");
      expect(en["scan.title"]).toBeDefined();
      expect(en["scan.subtitle"]).toBeDefined();
      expect(en["scan.success"]).toBeDefined();
    });

    it("has card-related keys", () => {
      const en = getTranslation("en");
      expect(en["card.labResults"]).toBeDefined();
      expect(en["card.prescriptions"]).toBeDefined();
      expect(en["card.discharge"]).toBeDefined();
      expect(en["card.otherDocuments"]).toBeDefined();
    });

    it("has button-related keys", () => {
      const en = getTranslation("en");
      expect(en["btn.tryAgain"]).toBeDefined();
      expect(en["btn.scanAnother"]).toBeDefined();
      expect(en["btn.goHome"]).toBeDefined();
    });

    it("has results-related keys", () => {
      const en = getTranslation("en");
      expect(en["results.loading"]).toBeDefined();
      expect(en["results.noResults"]).toBeDefined();
      expect(en["results.section.summary"]).toBeDefined();
      expect(en["results.section.tanqmo"]).toBeDefined();
    });

    it("has landing page keys", () => {
      const en = getTranslation("en");
      expect(en["hero.title1"]).toBeDefined();
      expect(en["features.heading"]).toBeDefined();
      expect(en["cta.heading"]).toBeDefined();
      expect(en["clarity.heading"]).toBeDefined();
      expect(en["moreThan.heading"]).toBeDefined();
    });
  });
});
