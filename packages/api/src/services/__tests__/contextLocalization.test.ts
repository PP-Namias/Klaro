import { describe, expect, it } from "vitest";

import { assembleDocumentContext } from "../contextAssembler";

/**
 * medicalTerminology carried Filipino, Bisaya and Ilocano names for every
 * common analyte but had no callers, so Clara's context was English-only even
 * when answering in a Philippine dialect.
 */
describe("assembleDocumentContext dialect localization", () => {
  const analysis = {
    extractedFields: { HGB: "11.2 g/dL", UNKNOWNCODE: "42" },
    plainLanguageSummary: null,
  };

  it("annotates known analytes with the Filipino term", () => {
    const context = assembleDocumentContext(analysis, undefined, "Filipino");

    expect(context).toContain("HGB");
    expect(context).toMatch(/Hemoglobin \(Dugo\)/);
  });

  it("annotates known analytes with the Bisaya term", () => {
    const context = assembleDocumentContext(analysis, undefined, "Bisaya");

    expect(context).toMatch(/Dugo/);
  });

  it("uses the English term when no dialect is given", () => {
    const context = assembleDocumentContext(analysis, undefined);

    expect(context).toContain("Hemoglobin");
  });

  it("passes through fields with no terminology entry unchanged", () => {
    const context = assembleDocumentContext(analysis, undefined, "Filipino");

    expect(context).toContain("UNKNOWNCODE: 42");
    expect(context).not.toMatch(/UNKNOWNCODE \(/);
  });
});
