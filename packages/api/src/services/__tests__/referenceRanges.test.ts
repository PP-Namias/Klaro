import { describe, expect, it } from "vitest";

import {
  lookupEntry,
  lookupPlausibility,
  lookupRange,
  REFERENCE_ENTRIES,
} from "../referenceRanges";

/**
 * severityScoring and hallucinationDetection used to carry separate range
 * tables that disagreed on HGB, HCT, RBC and CRE, so one path could badge a
 * result normal while the other flagged it. Both now read this table.
 */
describe("referenceRanges", () => {
  it("resolves by short code, canonical name and alias", () => {
    expect(lookupEntry("HGB")?.name).toBe("Hemoglobin");
    expect(lookupEntry("Hemoglobin")?.code).toBe("HGB");
    expect(lookupEntry("haemoglobin")?.code).toBe("HGB");
    expect(lookupEntry("sgpt")?.code).toBe("ALT");
    expect(lookupEntry("not-a-test")).toBeUndefined();
  });

  it("returns different hemoglobin ranges for male and female", () => {
    const male = lookupRange("HGB", { sex: "male" });
    const female = lookupRange("HGB", { sex: "female" });

    expect(male).toBeDefined();
    expect(female).toBeDefined();
    expect(male!.low).not.toBe(female!.low);
    expect(male!.high).not.toBe(female!.high);
    expect(male!.low).toBeGreaterThan(female!.low);
  });

  it("falls back to a general adult band when sex is unknown", () => {
    const general = lookupRange("HGB");

    expect(general).toBeDefined();
    expect(general!.sex).toBeUndefined();
  });

  it("applies sex-specific creatinine ranges", () => {
    const male = lookupRange("CRE", { sex: "male" });
    const female = lookupRange("CRE", { sex: "female" });

    expect(male!.high).toBeGreaterThan(female!.high);
  });

  it("exposes plausibility bounds separate from reference ranges", () => {
    const plausible = lookupPlausibility("HGB");
    const range = lookupRange("HGB");

    expect(plausible!.min).toBeLessThan(range!.low);
    expect(plausible!.max).toBeGreaterThan(range!.high);
  });

  it("returns undefined for an unknown analyte rather than guessing", () => {
    expect(lookupRange("Unobtainium")).toBeUndefined();
    expect(lookupPlausibility("Unobtainium")).toBeUndefined();
  });

  it("keeps every entry internally consistent", () => {
    for (const entry of REFERENCE_ENTRIES) {
      expect(entry.ranges.length).toBeGreaterThan(0);
      expect(entry.min).toBeLessThan(entry.max);
      for (const band of entry.ranges) {
        expect(band.low).toBeLessThanOrEqual(band.high);
        // low may be 0 for analytes with no lower bound of concern (LDL, TG,
        // total cholesterol), so only the upper bound is tied to plausibility.
        expect(band.low).toBeGreaterThanOrEqual(0);
        expect(band.high).toBeLessThanOrEqual(entry.max);
      }
      // A general fallback band must exist so lookups without context resolve.
      expect(entry.ranges.some((b) => !b.sex && b.minAge === undefined)).toBe(
        true,
      );
    }
  });
});
