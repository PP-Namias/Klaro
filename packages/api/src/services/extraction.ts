export interface ExtractedTest {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
}

/**
 * Comprehensive test name canonicalization database
 * 220+ variants for Philippine & international lab formats
 * Covers CBC, lipid panel, urinalysis, chemistry, etc.
 */
const CANONICAL_TEST_NAMES: Record<string, string> = {
  // Hemoglobin
  hemoglobin: "Hemoglobin",
  hgb: "Hemoglobin",
  hb: "Hemoglobin",
  haemoglobin: "Hemoglobin",
  "hb conc": "Hemoglobin",
  "hemoglobin conc": "Hemoglobin",
  "hemoglobin concentration": "Hemoglobin",

  // Hemoglobin A1C / Glycated
  "hemoglobin a1c": "Hemoglobin A1C",
  hba1c: "Hemoglobin A1C",
  "hb a1c": "Hemoglobin A1C",
  a1c: "Hemoglobin A1C",
  "glycated hemoglobin": "Hemoglobin A1C",
  glycohemoglobin: "Hemoglobin A1C",
  "glycosylated hemoglobin": "Hemoglobin A1C",

  // Red Blood Cell
  "red blood cell": "Red Blood Cell Count",
  rbc: "Red Blood Cell Count",
  "red cell count": "Red Blood Cell Count",
  "erythrocyte count": "Red Blood Cell Count",
  "rbc count": "Red Blood Cell Count",
  "red cells": "Red Blood Cell Count",
  erythrocytes: "Red Blood Cell Count",

  // White Blood Cell
  "white blood cell": "White Blood Cell Count",
  wbc: "White Blood Cell Count",
  "white cell count": "White Blood Cell Count",
  "leukocyte count": "White Blood Cell Count",
  "wbc count": "White Blood Cell Count",
  "total wbc": "White Blood Cell Count",
  leukocytes: "White Blood Cell Count",

  // Platelet
  platelets: "Platelet Count",
  plt: "Platelet Count",
  "platelet count": "Platelet Count",
  "thrombocyte count": "Platelet Count",
  "platelet cnt": "Platelet Count",
  plat: "Platelet Count",
  thrombocytes: "Platelet Count",

  // Hematocrit
  hematocrit: "Hematocrit",
  hct: "Hematocrit",
  pcv: "Hematocrit",
  "packed cell volume": "Hematocrit",
  "hct %": "Hematocrit",

  // MCV
  mcv: "MCV",
  "mean corpuscular volume": "MCV",
  "mean cell volume": "MCV",

  // MCH
  mch: "MCH",
  "mean corpuscular hemoglobin": "MCH",
  "mean cell hemoglobin": "MCH",

  // MCHC
  mchc: "MCHC",
  "mean corpuscular hemoglobin concentration": "MCHC",

  // RDW
  rdw: "RDW",
  "rdw-cv": "RDW",
  "rdw-sd": "RDW",
  "red cell distribution width": "RDW",
  "rdw cv": "RDW",
  "rdw sd": "RDW",

  // Neutrophils
  neutrophils: "Neutrophils",
  "neutrophil count": "Neutrophils",
  "neutrophil %": "Neutrophils",
  neuts: "Neutrophils",
  anc: "Neutrophils",
  "absolute neutrophil count": "Neutrophils",
  "seg neutrophils": "Neutrophils",
  "segmented neutrophils": "Neutrophils",
  "neutrophil percentage": "Neutrophils",
  segs: "Neutrophils",

  // Lymphocytes
  lymphocytes: "Lymphocytes",
  "lymphocyte count": "Lymphocytes",
  "lymph %": "Lymphocytes",
  lymphs: "Lymphocytes",
  "absolute lymphocyte count": "Lymphocytes",
  alc: "Lymphocytes",
  "lymphocyte %": "Lymphocytes",
  "lymphocytes %": "Lymphocytes",

  // Monocytes
  monocytes: "Monocytes",
  "monocyte %": "Monocytes",
  mono: "Monocytes",
  "monocyte count": "Monocytes",
  "monocytes %": "Monocytes",

  // Eosinophils
  eosinophils: "Eosinophils",
  "eosinophil %": "Eosinophils",
  eos: "Eosinophils",
  "eosinophil count": "Eosinophils",
  "eosinophils %": "Eosinophils",

  // Basophils
  basophils: "Basophils",
  "basophil %": "Basophils",
  baso: "Basophils",
  "basophil count": "Basophils",

  // Bands
  bands: "Bands",
  "band neutrophils": "Bands",
  stab: "Bands",
  "stab neutrophils": "Bands",
  "band count": "Bands",

  // Reticulocytes
  reticulocytes: "Reticulocytes",
  retic: "Reticulocytes",
  "retic count": "Reticulocytes",
  "reticulocyte count": "Reticulocytes",

  // ESR
  esr: "ESR",
  "erythrocyte sedimentation rate": "ESR",
  sedrate: "ESR",

  // Blood Glucose
  glucose: "Fasting Blood Glucose",
  "blood glucose": "Fasting Blood Glucose",
  fbg: "Fasting Blood Glucose",
  fbs: "Fasting Blood Glucose",
  "fasting glucose": "Fasting Blood Glucose",
  "fasting blood sugar": "Fasting Blood Sugar",
  rbs: "Random Blood Sugar",
  "random blood sugar": "Random Blood Sugar",
  "casual glucose": "Random Blood Sugar",
  "random glucose": "Random Blood Sugar",

  // Cholesterol
  cholesterol: "Total Cholesterol",
  "total cholesterol": "Total Cholesterol",
  chol: "Total Cholesterol",
  tc: "Total Cholesterol",
  "serum cholesterol": "Total Cholesterol",
  "total chol": "Total Cholesterol",

  // LDL
  ldl: "LDL Cholesterol",
  "ldl cholesterol": "LDL Cholesterol",
  "ldl-c": "LDL Cholesterol",
  "low density lipoprotein": "LDL Cholesterol",
  "ldl chol": "LDL Cholesterol",

  // HDL
  hdl: "HDL Cholesterol",
  "hdl cholesterol": "HDL Cholesterol",
  "hdl-c": "HDL Cholesterol",
  "high density lipoprotein": "HDL Cholesterol",
  "hdl chol": "HDL Cholesterol",

  // Triglyceride
  triglycerides: "Triglycerides",
  triglyceride: "Triglycerides",
  tg: "Triglycerides",
  trig: "Triglycerides",
  tri: "Triglycerides",

  // VLDL
  vldl: "VLDL Cholesterol",
  "vldl cholesterol": "VLDL Cholesterol",
  "very low density lipoprotein": "VLDL Cholesterol",
  "vldl-c": "VLDL Cholesterol",

  // Non-HDL
  "non-hdl": "Non-HDL Cholesterol",
  "non hdl": "Non-HDL Cholesterol",
  "non-hdl cholesterol": "Non-HDL Cholesterol",

  // Ratios
  "chol/hdl ratio": "Chol/HDL Ratio",
  "ldl/hdl ratio": "LDL/HDL Ratio",
  "cardiac risk ratio": "Chol/HDL Ratio",
  "total chol/hdl": "Chol/HDL Ratio",

  // Total Lipids
  "total lipids": "Total Lipids",

  // Creatinine
  creatinine: "Creatinine",
  "serum creatinine": "Creatinine",
  crea: "Creatinine",
  creat: "Creatinine",
  cr: "Creatinine",
  "crea conc": "Creatinine",

  // BUN
  bun: "Blood Urea Nitrogen",
  "blood urea nitrogen": "Blood Urea Nitrogen",
  urea: "Blood Urea Nitrogen",
  "serum urea": "Blood Urea Nitrogen",
  "urea nitrogen": "Blood Urea Nitrogen",

  // eGFR
  egfr: "eGFR",
  gfr: "eGFR",
  "estimated glomerular filtration rate": "eGFR",
  "estimated gfr": "eGFR",

  // Uric Acid
  "uric acid": "Uric Acid",
  ua: "Uric Acid",
  "serum uric acid": "Uric Acid",
  urate: "Uric Acid",

  // Sodium
  sodium: "Sodium",
  na: "Sodium",
  "serum sodium": "Sodium",
  "na+": "Sodium",

  // Potassium
  potassium: "Potassium",
  k: "Potassium",
  "serum potassium": "Potassium",
  "k+": "Potassium",

  // Chloride
  chloride: "Chloride",
  cl: "Chloride",
  "serum chloride": "Chloride",
  "cl-": "Chloride",

  // Bicarbonate / CO2
  bicarbonate: "Bicarbonate",
  hco3: "Bicarbonate",
  co2: "Bicarbonate",
  "carbon dioxide": "Bicarbonate",
  "total co2": "Bicarbonate",
  "bicarbonate co2": "Bicarbonate",

  // Calcium
  calcium: "Calcium",
  ca: "Calcium",
  "serum calcium": "Calcium",
  "ionized calcium": "Calcium",
  "ca++": "Calcium",
  "ca2+": "Calcium",

  // Phosphorus
  phosphorus: "Phosphorus",
  phosphorous: "Phosphorus",
  p: "Phosphorus",
  phosphate: "Phosphorus",
  po4: "Phosphorus",
  "serum phosphate": "Phosphorus",
  "inorganic phosphorus": "Phosphorus",
  phos: "Phosphorus",

  // Magnesium
  magnesium: "Magnesium",
  mg: "Magnesium",
  "serum magnesium": "Magnesium",
  "mg2+": "Magnesium",

  // Iron studies
  iron: "Iron",
  fe: "Iron",
  "serum iron": "Iron",
  tibc: "TIBC",
  "total iron binding capacity": "TIBC",
  uibc: "UIBC",
  ferritin: "Ferritin",
  "transferrin saturation": "Transferrin Saturation",
  "iron saturation": "Transferrin Saturation",
  tsat: "Transferrin Saturation",

  // AST
  ast: "AST",
  sgot: "AST",
  "ast/got": "AST",
  "glutamic oxaloacetic transaminase": "AST",

  // ALT
  alt: "ALT",
  sgpt: "ALT",
  "alt/gpt": "ALT",
  "glutamic pyruvic transaminase": "ALT",

  // Alkaline Phosphatase
  "alkaline phosphatase": "Alkaline Phosphatase",
  alp: "Alkaline Phosphatase",
  "alk phos": "Alkaline Phosphatase",
  "alk phosphatase": "Alkaline Phosphatase",

  // GGT
  ggt: "GGT",
  "gamma gt": "GGT",
  "gamma glutamyl transferase": "GGT",
  "gamma-gt": "GGT",
  "ggtp": "GGT",

  // Bilirubin total
  "total bilirubin": "Total Bilirubin",
  bilirubin: "Total Bilirubin",
  "t-bil": "Total Bilirubin",
  tbili: "Total Bilirubin",
  "serum bilirubin": "Total Bilirubin",
  "total bili": "Total Bilirubin",

  // Direct bilirubin
  "direct bilirubin": "Direct Bilirubin",
  "d-bilirubin": "Direct Bilirubin",
  "conjugated bilirubin": "Direct Bilirubin",
  "d-bili": "Direct Bilirubin",
  "direct bili": "Direct Bilirubin",

  // Indirect bilirubin
  "indirect bilirubin": "Indirect Bilirubin",
  "unconjugated bilirubin": "Indirect Bilirubin",
  "i-bil": "Indirect Bilirubin",
  "indirect bili": "Indirect Bilirubin",

  // Albumin
  albumin: "Albumin",
  "serum albumin": "Albumin",
  alb: "Albumin",

  // Total Protein
  "total protein": "Total Protein",
  protein: "Total Protein",
  tp: "Total Protein",
  "serum protein": "Total Protein",

  // Globulin
  globulin: "Globulin",
  "serum globulin": "Globulin",
  glob: "Globulin",

  // A/G Ratio
  "a/g ratio": "A/G Ratio",
  "albumin/globulin ratio": "A/G Ratio",
  "ag ratio": "A/G Ratio",

  // Urea & Electrolytes grouped already

  // TSH
  tsh: "TSH",
  "thyroid stimulating hormone": "TSH",
  thyrotropin: "TSH",

  // T3
  t3: "T3",
  triiodothyronine: "T3",
  "free t3": "T3",
  ft3: "T3",

  // T4
  t4: "T4",
  thyroxine: "T4",
  "free t4": "T4",
  ft4: "T4",
  "free thyroxine": "T4",

  // Vitamin D
  "vitamin d": "Vitamin D",
  "25-oh vitamin d": "Vitamin D",
  "25-hydroxy vitamin d": "Vitamin D",
  vitd: "Vitamin D",

  // Vitamin B12
  "vitamin b12": "Vitamin B12",
  b12: "Vitamin B12",
  cobalamin: "Vitamin B12",

  // Folate
  folate: "Folate",
  "folic acid": "Folate",
  "serum folate": "Folate",

  // PSA
  psa: "PSA",
  "prostate specific antigen": "PSA",
  "total psa": "PSA",
  "free psa": "PSA",

  // CRP
  crp: "CRP",
  "c-reactive protein": "CRP",
  "cr protein": "CRP",

  // Procalcitonin
  procalcitonin: "Procalcitonin",
  pct: "Procalcitonin",

  // Hepatitis B
  hbsag: "Hepatitis B Surface Antigen",
  "hbs ag": "Hepatitis B Surface Antigen",
  "hepatitis b surface antigen": "Hepatitis B Surface Antigen",
  "hep b surface ag": "Hepatitis B Surface Antigen",
  "anti-hbs": "Hepatitis B Surface Antibody",
  "hbs antibody": "Hepatitis B Surface Antibody",
  "hepatitis b surface antibody": "Hepatitis B Surface Antibody",

  // Hepatitis C
  hcv: "Hepatitis C",
  "anti-hcv": "Hepatitis C",
  "hepatitis c antibody": "Hepatitis C",
  "hcv antibody": "Hepatitis C",

  // HIV
  hiv: "HIV",
  "hiv 1/2": "HIV",
  "hiv screen": "HIV",
  "anti-hiv": "HIV",

  // Syphilis
  rpr: "RPR",
  vdrl: "VDRL",
  syphilis: "Syphilis",

  // Blood Type
  "blood type": "Blood Type",
  abo: "Blood Type",
  "blood group": "Blood Type",
  "abo grouping": "Blood Type",

  // Urinalysis - general
  "urine color": "Urine Color",
  color: "Urine Color",
  "urine appearance": "Urine Appearance",
  appearance: "Urine Appearance",
  clarity: "Urine Appearance",
  ph: "Urine pH",
  "urine ph": "Urine pH",
  "specific gravity": "Urine Specific Gravity",
  "urine specific gravity": "Urine Specific Gravity",
  spgr: "Urine Specific Gravity",
  sg: "Urine Specific Gravity",

  // Urine chemistry
  "urine protein": "Urine Protein",
  "protein urine": "Urine Protein",
  "urine glucose": "Urine Glucose",
  "glucose urine": "Urine Glucose",
  ketones: "Urine Ketones",
  ketone: "Urine Ketones",
  "urine ketones": "Urine Ketones",
  "bilirubin urine": "Urine Bilirubin",
  "urine bilirubin": "Urine Bilirubin",
  "blood urine": "Urine Blood",
  "urine blood": "Urine Blood",
  "occult blood": "Urine Blood",
  "leukocyte esterase": "Leukocyte Esterase",
  "leuk esterase": "Leukocyte Esterase",
  nitrite: "Urine Nitrite",
  "urine nitrite": "Urine Nitrite",
  urobilinogen: "Urobilinogen",
  "urine urobilinogen": "Urobilinogen",

  // Urine microscopy
  "rbc urine": "Urine RBC",
  "urine rbc": "Urine RBC",
  "red cells urine": "Urine RBC",
  "wbc urine": "Urine WBC",
  "urine wbc": "Urine WBC",
  "pus cells": "Urine WBC",
  "epithelial cells": "Urine Epithelial Cells",
  "squamous epithelial cells": "Urine Epithelial Cells",
  "epithelial cell": "Urine Epithelial Cells",
  bacteria: "Urine Bacteria",
  "urine bacteria": "Urine Bacteria",
  crystals: "Urine Crystals",
  "calcium oxalate": "Urine Crystals",
  "uric acid crystals": "Urine Crystals",
  "triple phosphate": "Urine Crystals",
  "amorphous urates": "Urine Crystals",
  "amorphous phosphates": "Urine Crystals",
  casts: "Urine Casts",
  "hyaline casts": "Urine Casts",
  "granular casts": "Urine Casts",
  "waxy casts": "Urine Casts",
  "rbc casts": "Urine Casts",
  "wbc casts": "Urine Casts",
  mucus: "Urine Mucus",
  "mucus threads": "Urine Mucus",
  yeast: "Urine Yeast",

  // Hematology others
  inr: "INR",
  "international normalized ratio": "INR",
  pt: "Prothrombin Time",
  "prothrombin time": "Prothrombin Time",
  aptt: "Partial Thromboplastin Time",
  ptt: "Partial Thromboplastin Time",
  "partial thromboplastin time": "Partial Thromboplastin Time",
  fibrinogen: "Fibrinogen",
  "d-dimer": "D-Dimer",
  ddimmer: "D-Dimer",
};

/**
 * Philippine lab format regex patterns
 */
const LAB_PATTERNS = [
  // Pattern 1: "TestName: value unit (reference range)"
  /^([A-Za-z\s-/()]+?):\s*([\d.]+)\s+([A-Za-z/%\-°C°Fµ³]+?)(?:\s*\(([\d.\-\s]+?)\))?$/,
  // Pattern 2: "TestName value unit (reference range)" (no colon)
  /^([A-Za-z\s-/()]+?)\s+([\d.]+)\s+([A-Za-z/%\-°C°Fµ³]+?)(?:\s*\(([\d.\-\s]+?)\))?$/,
  // Pattern 3: "TestName: value (reference range)" (abbreviated, with optional ref range)
  /^([A-Za-z\s-/()0-9]+?):\s*([\d.]+)(?:\s*\(([\d.\-\s]+?)\))?$/,
  // Pattern 4: Tab-separated
  /^([A-Za-z\s-/()]+?)\t+([\d.]+)\t+([A-Za-z/%\-°C°Fµ³]+?)(?:\t+([\d.\-\s]+?))?$/,
  // Pattern 5: Philippine format "TestName ........ value" dotted leaders
  /^([A-Za-z\s-/()]+?)\s*\.+\s*([\d.]+)\s*([A-Za-z/%\-°C°Fµ³]*)?(?:\s*\(([\d.\-\s]+?)\))?$/,
  // Pattern 6: Compact "TEST=123" or "TEST:123"
  /^([A-Za-z\s-/()]+?)\s*[:=]\s*([\d.]+)\s*([A-Za-z/%\-°C°Fµ³]*)?$/,
];

const rangeRegex = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/;

/**
 * Canonicalize test name using lookup table
 */
const normalizeName = (name: string): string => {
  const cleaned = name.trim().replace(/\s+/g, " ").replace(/\.+$/, "");
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
      const match = pattern.exec(line);
      if (!match) continue;

      const name = normalizeName(match[1] ?? "");
      const value = match[2] ?? "";
      const unit = match[3] ?? "";
      const referenceRange = match[4];

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

export const getCanonicalTestCount = (): number => Object.keys(CANONICAL_TEST_NAMES).length;

export const getSupportedTestNames = (): string[] => [...new Set(Object.values(CANONICAL_TEST_NAMES))];

