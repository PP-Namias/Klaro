import { describe, expect, it } from "vitest";

import {
  LanguageCode,
  languageSchema,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  DEFAULT_LANGUAGE,
  DIALECT_TO_LANGUAGE,
  LANGUAGE_TO_DIALECT,
} from "../language";

describe("LanguageCode", () => {
  it("has 4 language codes", () => {
    const codes = Object.values(LanguageCode);
    expect(codes).toHaveLength(4);
    expect(codes).toContain("en");
    expect(codes).toContain("fil");
    expect(codes).toContain("ceb");
    expect(codes).toContain("ilo");
  });
});

describe("languageSchema", () => {
  it("validates English", () => {
    expect(languageSchema.safeParse("en").success).toBe(true);
  });

  it("validates Filipino", () => {
    expect(languageSchema.safeParse("fil").success).toBe(true);
  });

  it("validates Bisaya", () => {
    expect(languageSchema.safeParse("ceb").success).toBe(true);
  });

  it("validates Ilocano", () => {
    expect(languageSchema.safeParse("ilo").success).toBe(true);
  });

  it("rejects invalid language codes", () => {
    expect(languageSchema.safeParse("tl").success).toBe(false);
    expect(languageSchema.safeParse("bisaya").success).toBe(false);
    expect(languageSchema.safeParse("ilocano").success).toBe(false);
    expect(languageSchema.safeParse("").success).toBe(false);
  });
});

describe("LANGUAGE_LABELS", () => {
  it("has labels for all 4 languages", () => {
    expect(Object.keys(LANGUAGE_LABELS)).toHaveLength(4);
  });

  it("has English label", () => {
    expect(LANGUAGE_LABELS.en.name).toBe("English");
    expect(LANGUAGE_LABELS.en.nativeName).toBe("English");
  });

  it("has Filipino label", () => {
    expect(LANGUAGE_LABELS.fil.name).toBe("Filipino");
    expect(LANGUAGE_LABELS.fil.nativeName).toBe("Filipino");
  });

  it("has Bisaya label", () => {
    expect(LANGUAGE_LABELS.ceb.name).toBe("Bisaya");
    expect(LANGUAGE_LABELS.ceb.nativeName).toBe("Binisaya");
  });

  it("has Ilocano label", () => {
    expect(LANGUAGE_LABELS.ilo.name).toBe("Ilocano");
    expect(LANGUAGE_LABELS.ilo.nativeName).toBe("Ilokano");
  });
});

describe("LANGUAGE_OPTIONS", () => {
  it("returns 4 options", () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(4);
  });

  it("each option has code, name, and nativeName", () => {
    for (const opt of LANGUAGE_OPTIONS) {
      expect(opt).toHaveProperty("code");
      expect(opt).toHaveProperty("name");
      expect(opt).toHaveProperty("nativeName");
    }
  });
});

describe("DEFAULT_LANGUAGE", () => {
  it("defaults to Filipino", () => {
    expect(DEFAULT_LANGUAGE).toBe("fil");
  });
});

describe("DIALECT_TO_LANGUAGE", () => {
  it("maps Filipino to fil", () => {
    expect(DIALECT_TO_LANGUAGE.Filipino).toBe("fil");
  });

  it("maps Bisaya to ceb", () => {
    expect(DIALECT_TO_LANGUAGE.Bisaya).toBe("ceb");
  });

  it("maps Ilocano to ilo", () => {
    expect(DIALECT_TO_LANGUAGE.Ilocano).toBe("ilo");
  });

  it("maps English to en", () => {
    expect(DIALECT_TO_LANGUAGE.English).toBe("en");
  });
});

describe("LANGUAGE_TO_DIALECT", () => {
  it("maps fil to Filipino", () => {
    expect(LANGUAGE_TO_DIALECT.fil).toBe("Filipino");
  });

  it("maps ceb to Bisaya", () => {
    expect(LANGUAGE_TO_DIALECT.ceb).toBe("Bisaya");
  });

  it("maps ilo to Ilocano", () => {
    expect(LANGUAGE_TO_DIALECT.ilo).toBe("Ilocano");
  });

  it("maps en to English", () => {
    expect(LANGUAGE_TO_DIALECT.en).toBe("English");
  });
});
