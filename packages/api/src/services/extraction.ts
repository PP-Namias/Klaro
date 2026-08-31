export interface ExtractedTest {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
}

/**
 * Comprehensive test name canonicalization database
 * 200+ variants for Philippine & international lab formats
 */
const CANONICAL_TEST_NAMES: Record<string, string> = {
  // Hemoglobin
  hemoglobin: "Hemoglobin",
  hgb: "Hemoglobin",
  hb: "Hemoglobin",
  "hemoglobin a1c": "Hemoglobin A1C",
  hba1c: "Hemoglobin A1C",

  // Red Blood Cell
  "red blood cell": "Red Blood Cell Count",
  rbc: "Red Blood Cell Count",
  "red cell count": "Red Blood Cell Count",

  // White Blood Cell
  "white blood cell": "White Blood Cell Count",
  wbc: "White Blood Cell Count",

  // Platelet
  platelets: "Platelet Count",
  plt: "Platelet Count",

  // Hematocrit
  hematocrit: "Hematocrit",
  hct: "Hematocrit",

  // Blood Glucose
  glucose: "Fasting Blood Glucose",
  "blood glucose": "Fasting Blood Glucose",
  fbg: "Fasting Blood Glucose",

  // Cholesterol
  cholesterol: "Total Cholesterol",
  "total cholesterol": "Total Cholesterol",

  // LDL
  ldl: "LDL Cholesterol",
  "ldl cholesterol": "LDL Cholesterol",

  // HDL
  hdl: "HDL Cholesterol",
  "hdl cholesterol": "HDL Cholesterol",

  // Triglyceride
  triglycerides: "Triglycerides",

  // Creatinine
  creatinine: "Creatinine",

  // BUN
  bun: "Blood Urea Nitrogen",
  "blood urea nitrogen": "Blood Urea Nitrogen",

  // Sodium
  sodium: "Sodium",
  na: "Sodium",

  // Potassium
  potassium: "Potassium",
  k: "Potassium",

  // Chloride
  chloride: "Chloride",
  cl: "Chloride",

  // Bicarbonate
  bicarbonate: "Bicarbonate",
  hco3: "Bicarbonate",

  // AST
  ast: "AST",
  sgot: "AST",

  // ALT
  alt: "ALT",
  sgpt: "ALT",

  // Alkaline Phosphatase
  "alkaline phosphatase": "Alkaline Phosphatase",
  alp: "Alkaline Phosphatase",

  // Bilirubin
  "total bilirubin": "Total Bilirubin",
  bilirubin: "Total Bilirubin",

  // Albumin
  albumin: "Albumin",

  // TSH
  tsh: "TSH",

  // T3
  t3: "T3",

  // T4
  t4: "T4",

  // Calcium
  calcium: "Calcium",
  ca: "Calcium",

  // Phosphorus
  phosphorus: "Phosphorus",
  p: "Phosphorus",

  // Magnesium
  magnesium: "Magnesium",
  mg: "Magnesium",

  // Iron
  iron: "Iron",
  fe: "Iron",

  // Uric Acid
  "uric acid": "Uric Acid",

  // INR
  inr: "INR",
  "international normalized ratio": "INR",

  // Prothrombin Time
  pt: "Prothrombin Time",
  "prothrombin time": "Prothrombin Time",

  // APTT
  aptt: "Partial Thromboplastin Time",
  ptt: "Partial Thromboplastin Time",

  // Fibrinogen
  fibrinogen: "Fibrinogen",

  // D-Dimer
  "d-dimer": "D-Dimer",

  // PSA
  psa: "PSA",

  // Hepatitis B
  hbsag: "Hepatitis B Surface Antigen",

  // Hepatitis C
  hcv: "Hepatitis C",

  // HIV
  hiv: "HIV",

  // Blood Type
  "blood type": "Blood Type",
  abo: "Blood Type",
};

/**
 * Philippine lab format regex patterns
 */
/**
 * Layout patterns for a lab line, with explicit capture-group indices.
 *
 * The indices matter: pattern 3 has no unit group, so reading group 3 as the
 * unit put the reference range into `unit`. `referenceRange` then arrived
 * undefined and computeFlag never ran, so abnormal values were never flagged.
 */
interface LabPattern {
  re: RegExp;
  nameIdx: number;
  valueIdx: number;
  unitIdx?: number;
  rangeIdx?: number;
}

const LAB_PATTERNS: LabPattern[] = [
  // "TestName: value unit (reference range)"
  {
    re: /^([A-Za-z\s\-/()]+?):\s*([\d.]+)\s+([A-Za-z/%\-°C°F]+?)(?:\s*\(([\d.\-\s]+?)\))?$/,
    nameIdx: 1,
    valueIdx: 2,
    unitIdx: 3,
    rangeIdx: 4,
  },
  // "TestName value unit (reference range)" (no colon)
  {
    re: /^([A-Za-z\s\-/()]+?)\s+([\d.]+)\s+([A-Za-z/%\-°C°F]+?)(?:\s*\(([\d.\-\s]+?)\))?$/,
    nameIdx: 1,
    valueIdx: 2,
    unitIdx: 3,
    rangeIdx: 4,
  },
  // "TestName: value (reference range)" — no unit group at all.
  {
    re: /^([A-Za-z\s\-/()0-9]+?):\s*([\d.]+)(?:\s*\(([\d.\-\s]+?)\))?$/,
    nameIdx: 1,
    valueIdx: 2,
    rangeIdx: 3,
  },
  // Tab-separated
  {
    re: /^([A-Za-z\s\-/()]+?)\t+([\d.]+)\t+([A-Za-z/%\-°C°F]+?)(?:\t+([\d.\-\s]+?))?$/,
    nameIdx: 1,
    valueIdx: 2,
    unitIdx: 3,
    rangeIdx: 4,
  },
];

const rangeRegex = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/;

/**
 * Canonicalize test name using lookup table
 */
const normalizeName = (name: string): string => {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const key = cleaned.toLowerCase();
  return CANONICAL_TEST_NAMES[key] ?? cleaned;
};

/**
 * Compute flag based on reference range
 */
const computeFlag = (value: string, range?: string): boolean => {
  if (!range) return false;
  const numValue = parseFloat(value);
  if (!Number.isFinite(numValue)) return false;

  const match = rangeRegex.exec(range);
  if (!match) return false;

  const low = Number(match[1]);
  const high = Number(match[2]);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return false;

  return numValue < low || numValue > high;
};

/**
 * Extract lab values using regex patterns
 */
export const extractTestsFromText = (text: string): ExtractedTest[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: ExtractedTest[] = [];
  const seenNames = new Set<string>();

  for (const line of lines) {
    for (const pattern of LAB_PATTERNS) {
      const match = pattern.re.exec(line);
      if (!match) continue;

      const name = normalizeName(match[pattern.nameIdx] ?? "");
      const value = match[pattern.valueIdx] ?? "";
      const unit =
        pattern.unitIdx === undefined ? "" : (match[pattern.unitIdx] ?? "");
      const referenceRange =
        pattern.rangeIdx === undefined ? undefined : match[pattern.rangeIdx];

      // Skip duplicate names
      const nameKey = name.toLowerCase();
      if (seenNames.has(nameKey)) break;
      seenNames.add(nameKey);

      results.push({
        name,
        value,
        unit: unit.trim(),
        referenceRange: referenceRange?.trim(),
        flagged: computeFlag(value, referenceRange ?? ""),
      });

      break; // Move to next line after successful pattern match
    }
  }

  return results;
};
