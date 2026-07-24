import { describe, expect, it } from "vitest";

import {
  batchConvert,
  convertToPlainLanguage,
  getAllTerminology,
  getBisayaTerm,
  getFilipinoTerm,
  getIlocanoTerm,
  getTerminology,
  searchTerminology,
  TERMINOLOGY_DB,
} from "../medicalTerminology";

describe("Medical Terminology", () => {
  describe("getTerminology", () => {
    it("returns terminology by code", () => {
      const term = getTerminology("HGB");
      expect(term).not.toBeNull();
      expect(term?.english).toBe("Hemoglobin");
    });

    it("is case insensitive", () => {
      const term = getTerminology("hgb");
      expect(term).not.toBeNull();
    });

    it("returns null for unknown code", () => {
      const term = getTerminology("UNKNOWN");
      expect(term).toBeNull();
    });
  });

  describe("convertToPlainLanguage", () => {
    it("converts to English", () => {
      expect(convertToPlainLanguage("HGB", "en")).toBe("Hemoglobin");
    });

    it("converts to Filipino", () => {
      expect(convertToPlainLanguage("HGB", "fil")).toContain("Dugo");
    });

    it("converts to Bisaya", () => {
      expect(convertToPlainLanguage("HGB", "bisaya")).toContain("Dugo");
    });

    it("converts to Ilocano", () => {
      expect(convertToPlainLanguage("HGB", "ilocano")).toContain("Dugo");
    });

    it("returns original code for unknown", () => {
      expect(convertToPlainLanguage("UNKNOWN", "en")).toBe("UNKNOWN");
    });
  });

  describe("getFilipinoTerm", () => {
    it("returns Filipino translation", () => {
      expect(getFilipinoTerm("GLU")).toContain("Asukal");
    });
  });

  describe("getBisayaTerm", () => {
    it("returns Bisaya translation", () => {
      expect(getBisayaTerm("GLU")).toContain("Asukal");
    });
  });

  describe("getIlocanoTerm", () => {
    it("returns Ilocano translation", () => {
      expect(getIlocanoTerm("GLU")).toContain("Asukal");
    });
  });

  describe("batchConvert", () => {
    it("converts multiple codes", () => {
      const results = batchConvert(["HGB", "GLU", "CHOL"], "fil");
      expect(results).toHaveLength(3);
      expect(results[0].code).toBe("HGB");
    });

    it("includes original and converted", () => {
      const results = batchConvert(["HGB"], "fil");
      expect(results[0].original).toBe("Hemoglobin");
      expect(results[0].converted).toContain("Dugo");
    });
  });

  describe("searchTerminology", () => {
    it("searches by code", () => {
      const results = searchTerminology("HGB");
      expect(results.length).toBeGreaterThan(0);
    });

    it("searches by English name", () => {
      const results = searchTerminology("Hemoglobin");
      expect(results.length).toBeGreaterThan(0);
    });

    it("searches by Filipino name", () => {
      const results = searchTerminology("Dugo");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for no match", () => {
      const results = searchTerminology("xyz123");
      expect(results).toHaveLength(0);
    });
  });

  describe("getAllTerminology", () => {
    it("returns all terminology entries", () => {
      const all = getAllTerminology();
      expect(all.length).toBe(TERMINOLOGY_DB.length);
    });

    it("returns a copy", () => {
      const all = getAllTerminology();
      all.pop();
      expect(getAllTerminology().length).toBe(TERMINOLOGY_DB.length);
    });
  });
});
