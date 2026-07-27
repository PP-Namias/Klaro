import { describe, expect, it } from "vitest";

import ceb from "../ceb";
import en from "../en";
import fil from "../fil";
import ilo from "../ilo";
import { getTranslation, t } from "../index";

describe("Translation dictionaries", () => {
  it("English dictionary has all keys", () => {
    expect(Object.keys(en).length).toBeGreaterThan(50);
  });

  it("Filipino dictionary has all keys", () => {
    expect(Object.keys(fil).length).toBeGreaterThan(50);
  });

  it("Bisaya dictionary has all keys", () => {
    expect(Object.keys(ceb).length).toBeGreaterThan(50);
  });

  it("Ilocano dictionary has all keys", () => {
    expect(Object.keys(ilo).length).toBeGreaterThan(50);
  });

  it("all dictionaries have the same keys", () => {
    const enKeys = Object.keys(en).sort();
    const filKeys = Object.keys(fil).sort();
    const cebKeys = Object.keys(ceb).sort();
    const iloKeys = Object.keys(ilo).sort();

    expect(filKeys).toEqual(enKeys);
    expect(cebKeys).toEqual(enKeys);
    expect(iloKeys).toEqual(enKeys);
  });
});

describe("t() function", () => {
  it("returns English translation for en", () => {
    const result = t("en", "scan.title");
    expect(result).toBe(en["scan.title"]);
  });

  it("returns Filipino translation for fil", () => {
    const result = t("fil", "scan.title");
    expect(result).toBe(fil["scan.title"]);
  });

  it("returns Bisaya translation for ceb", () => {
    const result = t("ceb", "scan.title");
    expect(result).toBe(ceb["scan.title"]);
  });

  it("returns Ilocano translation for ilo", () => {
    const result = t("ilo", "scan.title");
    expect(result).toBe(ilo["scan.title"]);
  });

  it("returns key itself for missing keys", () => {
    const result = t("en", "nonexistent.key");
    expect(result).toBe("nonexistent.key");
  });

  it("handles parameter interpolation", () => {
    const result = t("en", "btn.scanFiles", { count: 3 });
    expect(result).toContain("3");
  });
});

describe("getTranslation()", () => {
  it("returns English dictionary", () => {
    const dict = getTranslation("en");
    expect(dict["scan.title"]).toBe(en["scan.title"]);
  });

  it("returns Filipino dictionary", () => {
    const dict = getTranslation("fil");
    expect(dict["scan.title"]).toBe(fil["scan.title"]);
  });

  it("falls back to English for unknown language", () => {
    const dict = getTranslation("xx" as any);
    expect(dict["scan.title"]).toBe(en["scan.title"]);
  });
});
