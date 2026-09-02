/**
 * Single source of truth for laboratory reference ranges.
 *
 * This replaces two tables that disagreed with each other:
 *   - severityScoring.ts, which drove the UI severity badges (21 analytes)
 *   - hallucinationDetection.ts, which drove implausible-value rejection
 *
 * They conflicted on HGB, HCT, RBC and CRE, so the same result could be badged
 * "normal" by one path and "abnormal" by the other. Those conflicts are
 * resolved here by adopting sex-specific adult ranges, which is why they
 * differed in the first place: one table carried the male range and the other a
 * combined one.
 *
 * Ranges are adult values for the units given, consistent with the intervals
 * commonly printed on Philippine laboratory reports (DOH-licensed clinical
 * laboratories broadly follow standard adult reference intervals). Paediatric
 * values are deliberately NOT modelled: they vary by age band per analyte and
 * inventing them would be unsafe. `lookupRange` returns the adult range when no
 * age-specific band matches, and callers should treat paediatric results as
 * unvalidated rather than assume normality.
 *
 * `min`/`max` are *plausibility* bounds — values outside them are almost
 * certainly a misread or a model hallucination rather than a real measurement.
 */

export type Sex = "male" | "female";

export interface ReferenceBand {
  /** Applies only to this sex when set. */
  sex?: Sex;
  /** Inclusive lower age bound in years. */
  minAge?: number;
  /** Inclusive upper age bound in years. */
  maxAge?: number;
  low: number;
  high: number;
}

export interface ReferenceEntry {
  /** Canonical display name, matching extraction's canonical names. */
  name: string;
  /** Short code used by severity scoring and the UI. */
  code: string;
  /** Additional accepted lookup keys. */
  aliases: string[];
  unit: string;
  /** Units seen on reports for this analyte. */
  units: string[];
  /** Biologically plausible bounds; outside this is a misread. */
  min: number;
  max: number;
  /** Most specific band first; the first match wins. */
  ranges: ReferenceBand[];
}

export const REFERENCE_ENTRIES: ReferenceEntry[] = [
  // ---------------------------------------------------------------- Hematology
  {
    name: "Hemoglobin",
    code: "HGB",
    aliases: ["hb", "haemoglobin"],
    unit: "g/dL",
    units: ["g/dL", "g/L"],
    min: 2,
    max: 25,
    // Sex-specific: this is the conflict between the two old tables.
    ranges: [
      { sex: "male", low: 13.5, high: 17.5 },
      { sex: "female", low: 12, high: 15.5 },
      { low: 12, high: 17.5 },
    ],
  },
  {
    name: "Hematocrit",
    code: "HCT",
    aliases: ["packed cell volume", "pcv"],
    unit: "%",
    units: ["%"],
    min: 10,
    max: 70,
    ranges: [
      { sex: "male", low: 41, high: 50 },
      { sex: "female", low: 36, high: 44 },
      { low: 36, high: 50 },
    ],
  },
  {
    name: "Red Blood Cell Count",
    code: "RBC",
    aliases: ["erythrocyte count"],
    unit: "million/uL",
    units: ["M/µL", "10^6/µL", "million/uL"],
    min: 0.5,
    max: 10,
    ranges: [
      { sex: "male", low: 4.5, high: 5.9 },
      { sex: "female", low: 4.1, high: 5.1 },
      { low: 4.1, high: 5.9 },
    ],
  },
  {
    name: "White Blood Cell Count",
    code: "WBC",
    aliases: ["leukocyte count"],
    unit: "/uL",
    units: ["/uL", "K/µL", "10^3/µL"],
    // Reports use either /uL (4500) or K/µL (4.5); plausibility spans both.
    min: 0.1,
    max: 200000,
    ranges: [{ low: 4500, high: 11000 }],
  },
  {
    name: "Platelet Count",
    code: "PLT",
    aliases: ["thrombocyte count"],
    unit: "/uL",
    units: ["/uL", "K/µL", "10^3/µL"],
    // Reports use either /uL (250000) or K/µL (250); plausibility spans both.
    min: 1,
    max: 2000000,
    ranges: [{ low: 150000, high: 400000 }],
  },
  // ------------------------------------------------------------ Blood chemistry
  {
    name: "Fasting Blood Glucose",
    code: "GLU",
    aliases: ["glucose", "fbs", "fasting blood sugar"],
    unit: "mg/dL",
    units: ["mg/dL", "mmol/L"],
    min: 10,
    max: 1500,
    ranges: [{ low: 70, high: 100 }],
  },
  {
    name: "Hemoglobin A1C",
    code: "HBA1C",
    aliases: ["hba1c", "a1c"],
    unit: "%",
    units: ["%"],
    min: 3,
    max: 20,
    ranges: [{ low: 4, high: 5.7 }],
  },
  {
    name: "Blood Urea Nitrogen",
    code: "BUN",
    aliases: ["urea nitrogen"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 1,
    max: 250,
    ranges: [{ low: 7, high: 20 }],
  },
  {
    name: "Creatinine",
    code: "CRE",
    aliases: ["crea", "serum creatinine"],
    unit: "mg/dL",
    units: ["mg/dL", "µmol/L"],
    min: 0.1,
    max: 25,
    // Sex-specific: the other old-table conflict.
    ranges: [
      { sex: "male", low: 0.74, high: 1.35 },
      { sex: "female", low: 0.59, high: 1.04 },
      { low: 0.6, high: 1.2 },
    ],
  },
  {
    name: "Uric Acid",
    code: "UA",
    aliases: ["serum uric acid"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 0.5,
    max: 30,
    ranges: [
      { sex: "male", low: 3.4, high: 7 },
      { sex: "female", low: 2.4, high: 6 },
      { low: 2.4, high: 7 },
    ],
  },
  // --------------------------------------------------------------- Lipid panel
  {
    name: "Total Cholesterol",
    code: "CHOL",
    aliases: ["cholesterol"],
    unit: "mg/dL",
    units: ["mg/dL", "mmol/L"],
    min: 20,
    max: 800,
    ranges: [{ low: 0, high: 200 }],
  },
  {
    name: "HDL Cholesterol",
    code: "HDL",
    aliases: ["hdl-c"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 5,
    max: 200,
    ranges: [{ low: 40, high: 60 }],
  },
  {
    name: "LDL Cholesterol",
    code: "LDL",
    aliases: ["ldl-c"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 5,
    max: 500,
    ranges: [{ low: 0, high: 100 }],
  },
  {
    name: "Triglycerides",
    code: "TG",
    aliases: ["trig"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 10,
    max: 3000,
    ranges: [{ low: 0, high: 150 }],
  },
  // ------------------------------------------------------------ Liver function
  {
    name: "ALT",
    code: "ALT",
    aliases: ["sgpt", "alanine aminotransferase"],
    unit: "U/L",
    units: ["U/L", "IU/L"],
    min: 1,
    max: 5000,
    ranges: [{ low: 7, high: 56 }],
  },
  {
    name: "AST",
    code: "AST",
    aliases: ["sgot", "aspartate aminotransferase"],
    unit: "U/L",
    units: ["U/L", "IU/L"],
    min: 1,
    max: 5000,
    ranges: [{ low: 10, high: 40 }],
  },
  {
    name: "Total Bilirubin",
    code: "TBILI",
    aliases: ["bilirubin total"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 0,
    max: 50,
    ranges: [{ low: 0.1, high: 1.2 }],
  },
  {
    name: "Albumin",
    code: "ALB",
    aliases: ["serum albumin"],
    unit: "g/dL",
    units: ["g/dL", "g/L"],
    min: 0.5,
    max: 8,
    ranges: [{ low: 3.5, high: 5 }],
  },
  // -------------------------------------------------------------- Electrolytes
  {
    name: "Sodium",
    code: "NA",
    aliases: ["na"],
    unit: "mEq/L",
    units: ["mEq/L", "mmol/L"],
    min: 90,
    max: 200,
    ranges: [{ low: 136, high: 145 }],
  },
  {
    name: "Potassium",
    code: "K",
    aliases: [],
    unit: "mEq/L",
    units: ["mEq/L", "mmol/L"],
    min: 1,
    max: 10,
    ranges: [{ low: 3.5, high: 5 }],
  },
  {
    name: "Chloride",
    code: "CL",
    aliases: [],
    unit: "mEq/L",
    units: ["mEq/L", "mmol/L"],
    min: 50,
    max: 150,
    ranges: [{ low: 98, high: 106 }],
  },
  {
    name: "Calcium",
    code: "CA",
    aliases: ["total calcium"],
    unit: "mg/dL",
    units: ["mg/dL", "mmol/L"],
    min: 3,
    max: 20,
    ranges: [{ low: 8.5, high: 10.5 }],
  },
  {
    name: "Magnesium",
    code: "MG",
    aliases: [],
    unit: "mg/dL",
    units: ["mg/dL", "mmol/L"],
    min: 0.3,
    max: 8,
    ranges: [{ low: 1.7, high: 2.2 }],
  },
  {
    name: "Phosphorus",
    code: "PHOS",
    aliases: ["phosphate", "inorganic phosphorus"],
    unit: "mg/dL",
    units: ["mg/dL"],
    min: 0.5,
    max: 15,
    ranges: [{ low: 2.5, high: 4.5 }],
  },
  // ------------------------------------------------------------------- Thyroid
  {
    name: "TSH",
    code: "TSH",
    aliases: ["thyroid stimulating hormone"],
    unit: "mIU/L",
    units: ["mIU/L", "µIU/mL"],
    min: 0.005,
    max: 150,
    ranges: [{ low: 0.4, high: 4 }],
  },
  // ---------------------------------------------------------------------- Iron
  {
    name: "Iron",
    code: "FE",
    aliases: ["serum iron"],
    unit: "µg/dL",
    units: ["µg/dL", "ug/dL"],
    min: 5,
    max: 600,
    ranges: [{ low: 60, high: 170 }],
  },
];

/** Lookup index: code, canonical name and every alias, all lowercased. */
const INDEX = new Map<string, ReferenceEntry>();
for (const entry of REFERENCE_ENTRIES) {
  for (const key of [entry.code, entry.name, ...entry.aliases]) {
    INDEX.set(key.toLowerCase(), entry);
  }
}

export interface PatientContext {
  age?: number;
  sex?: Sex;
}

/** Find the entry for a short code, canonical name or alias. */
export function lookupEntry(
  testCodeOrName: string,
): ReferenceEntry | undefined {
  return INDEX.get(testCodeOrName.trim().toLowerCase());
}

/**
 * Resolve the applicable range for a patient.
 *
 * Bands are evaluated in order, so sex- and age-specific entries take
 * precedence over the general adult fallback. Returns undefined for an unknown
 * analyte — callers must treat that as "cannot validate", never as "normal".
 */
export function lookupRange(
  testCodeOrName: string,
  context: PatientContext = {},
): (ReferenceBand & { unit: string; entry: ReferenceEntry }) | undefined {
  const entry = lookupEntry(testCodeOrName);
  if (!entry) return undefined;

  const band = entry.ranges.find((candidate) => {
    if (candidate.sex && candidate.sex !== context.sex) return false;
    if (candidate.minAge !== undefined) {
      if (context.age === undefined || context.age < candidate.minAge) {
        return false;
      }
    }
    if (candidate.maxAge !== undefined) {
      if (context.age === undefined || context.age > candidate.maxAge) {
        return false;
      }
    }
    return true;
  });

  if (!band) return undefined;
  return { ...band, unit: entry.unit, entry };
}

/** Plausibility bounds for an analyte, if known. */
export function lookupPlausibility(
  testCodeOrName: string,
): { min: number; max: number; units: string[] } | undefined {
  const entry = lookupEntry(testCodeOrName);
  if (!entry) return undefined;
  return { min: entry.min, max: entry.max, units: entry.units };
}
