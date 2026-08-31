/**
 * Comprehensive test name canonicalization database
 * 200+ variants for Philippine & international lab formats
 */
import { REFERENCE_RANGES } from "./severityScoring";

export interface ExtractedTest {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flagged?: boolean;
}

/**
 * Canonical display name -> reference-range code.
 *
 * Lets extraction fall back to the built-in ranges when a document does not
 * print one, which is common on Philippine lab printouts. Without this, any
 * result without a printed range was silently reported as normal.
 */
const CANONICAL_NAME_TO_CODE: Record<string, string> = {
  Hemoglobin: "HGB",
  Hematocrit: "HCT",
  "Red Blood Cell Count": "RBC",
  "White Blood Cell Count": "WBC",
  "Platelet Count": "PLT",
  "Fasting Blood Glucose": "GLU",
  "Random Blood Sugar": "GLU",
  "Blood Urea Nitrogen": "BUN",
  Creatinine: "CRE",
  "Total Cholesterol": "CHOL",
  Cholesterol: "CHOL",
  "HDL Cholesterol": "HDL",
  "LDL Cholesterol": "LDL",
  Triglycerides: "TG",
  ALT: "ALT",
  AST: "AST",
  "Uric Acid": "UA",
  TSH: "TSH",
  Sodium: "NA",
  Potassium: "K",
  Chloride: "CL",
  Calcium: "CA",
  Magnesium: "MG",
};

/**
 * Alias -> canonical name for Philippine lab reports.
 *
 * 363 aliases across CBC, urinalysis, fecalysis, blood chemistry, lipid,
 * liver, cardiac, thyroid, coagulation, serology and tumour-marker panels.
 * Doubles as the allowlist of things this engine will call a lab result.
 */
export const CANONICAL_TEST_NAMES: Record<string, string> = {
  // Complete Blood Count
  hemoglobin: "Hemoglobin",
  hgb: "Hemoglobin",
  hb: "Hemoglobin",
  haemoglobin: "Hemoglobin",
  hematocrit: "Hematocrit",
  hct: "Hematocrit",
  haematocrit: "Hematocrit",
  "packed cell volume": "Hematocrit",
  pcv: "Hematocrit",
  "red blood cell count": "Red Blood Cell Count",
  rbc: "Red Blood Cell Count",
  "rbc count": "Red Blood Cell Count",
  "erythrocyte count": "Red Blood Cell Count",
  "white blood cell count": "White Blood Cell Count",
  wbc: "White Blood Cell Count",
  "wbc count": "White Blood Cell Count",
  "leukocyte count": "White Blood Cell Count",
  "leucocyte count": "White Blood Cell Count",
  "platelet count": "Platelet Count",
  plt: "Platelet Count",
  platelets: "Platelet Count",
  "thrombocyte count": "Platelet Count",
  "mean corpuscular volume": "Mean Corpuscular Volume",
  mcv: "Mean Corpuscular Volume",
  "mean corpuscular hemoglobin": "Mean Corpuscular Hemoglobin",
  mch: "Mean Corpuscular Hemoglobin",
  "mean corpuscular hemoglobin concentration":
    "Mean Corpuscular Hemoglobin Concentration",
  mchc: "Mean Corpuscular Hemoglobin Concentration",
  "red cell distribution width": "Red Cell Distribution Width",
  rdw: "Red Cell Distribution Width",
  "rdw-cv": "Red Cell Distribution Width",
  "mean platelet volume": "Mean Platelet Volume",
  mpv: "Mean Platelet Volume",
  neutrophils: "Neutrophils",
  neutrophil: "Neutrophils",
  segmenters: "Neutrophils",
  "segmented neutrophils": "Neutrophils",
  segs: "Neutrophils",
  polymorphonuclear: "Neutrophils",
  lymphocytes: "Lymphocytes",
  lymphocyte: "Lymphocytes",
  lymphs: "Lymphocytes",
  monocytes: "Monocytes",
  monocyte: "Monocytes",
  eosinophils: "Eosinophils",
  eosinophil: "Eosinophils",
  eos: "Eosinophils",
  basophils: "Basophils",
  basophil: "Basophils",
  baso: "Basophils",
  "band cells": "Band Cells",
  bands: "Band Cells",
  "stab cells": "Band Cells",
  "erythrocyte sedimentation rate": "Erythrocyte Sedimentation Rate",
  esr: "Erythrocyte Sedimentation Rate",
  "sed rate": "Erythrocyte Sedimentation Rate",
  reticulocytes: "Reticulocytes",
  "retic count": "Reticulocytes",
  "reticulocyte count": "Reticulocytes",

  // Urinalysis
  "urine color": "Urine Color",
  "urine colour": "Urine Color",
  transparency: "Urine Transparency",
  "urine transparency": "Urine Transparency",
  clarity: "Urine Transparency",
  "specific gravity": "Specific Gravity",
  "sp gravity": "Specific Gravity",
  "sp. gravity": "Specific Gravity",
  spgr: "Specific Gravity",
  "urine ph": "Urine pH",
  reaction: "Urine pH",
  "urine protein": "Urine Protein",
  proteinuria: "Urine Protein",
  albuminuria: "Urine Protein",
  "urine glucose": "Urine Glucose",
  glycosuria: "Urine Glucose",
  "urine ketones": "Urine Ketones",
  ketones: "Urine Ketones",
  "ketone bodies": "Urine Ketones",
  acetone: "Urine Ketones",
  "urine blood": "Urine Blood",
  hematuria: "Urine Blood",
  "urine leukocytes": "Urine Leukocytes",
  "leukocyte esterase": "Urine Leukocytes",
  "urine nitrite": "Urine Nitrite",
  nitrite: "Urine Nitrite",
  nitrites: "Urine Nitrite",
  "urine bilirubin": "Urine Bilirubin",
  urobilinogen: "Urobilinogen",
  "urine urobilinogen": "Urobilinogen",
  "pus cells": "Pus Cells",
  "pus cell": "Pus Cells",
  "urine rbc": "Urine RBC",
  "red blood cells urine": "Urine RBC",
  "epithelial cells": "Epithelial Cells",
  "epithelial cell": "Epithelial Cells",
  "squamous epithelial cells": "Epithelial Cells",
  "urine bacteria": "Urine Bacteria",
  bacteria: "Urine Bacteria",
  bacteriuria: "Urine Bacteria",
  "urine casts": "Urine Casts",
  casts: "Urine Casts",
  "hyaline casts": "Urine Casts",
  "granular casts": "Urine Casts",
  "urine crystals": "Urine Crystals",
  crystals: "Urine Crystals",
  "amorphous urates": "Urine Crystals",
  "amorphous phosphates": "Urine Crystals",
  "calcium oxalate": "Urine Crystals",
  "mucus threads": "Mucus Threads",
  "mucus thread": "Mucus Threads",
  "mucous threads": "Mucus Threads",
  "yeast cells": "Yeast Cells",
  "yeast cell": "Yeast Cells",

  // Fecalysis
  "stool color": "Stool Color",
  "stool colour": "Stool Color",
  "fecal color": "Stool Color",
  "stool consistency": "Stool Consistency",
  consistency: "Stool Consistency",
  "occult blood": "Occult Blood",
  "fecal occult blood": "Occult Blood",
  fobt: "Occult Blood",
  guaiac: "Occult Blood",
  "ova and parasites": "Ova and Parasites",
  "o&p": "Ova and Parasites",
  parasite: "Ova and Parasites",
  parasites: "Ova and Parasites",
  ova: "Ova and Parasites",
  "stool wbc": "Stool WBC",
  "stool pus cells": "Stool WBC",
  "stool rbc": "Stool RBC",
  "fat globules": "Fat Globules",
  "fat globule": "Fat Globules",
  "stool bacteria": "Stool Bacteria",
  "entamoeba histolytica": "Entamoeba histolytica",
  "e. histolytica": "Entamoeba histolytica",
  "e histolytica": "Entamoeba histolytica",
  "ascaris lumbricoides": "Ascaris lumbricoides",
  ascaris: "Ascaris lumbricoides",
  "a. lumbricoides": "Ascaris lumbricoides",
  "trichuris trichiura": "Trichuris trichiura",
  trichuris: "Trichuris trichiura",
  whipworm: "Trichuris trichiura",
  hookworm: "Hookworm Ova",
  "hookworm ova": "Hookworm Ova",
  necator: "Hookworm Ova",
  ancylostoma: "Hookworm Ova",

  // Blood Chemistry
  "fasting blood glucose": "Fasting Blood Glucose",
  fbs: "Fasting Blood Glucose",
  "fasting blood sugar": "Fasting Blood Glucose",
  glucose: "Fasting Blood Glucose",
  "blood sugar": "Fasting Blood Glucose",
  "asukal sa dugo": "Fasting Blood Glucose",
  "random blood sugar": "Random Blood Sugar",
  rbs: "Random Blood Sugar",
  "random blood glucose": "Random Blood Sugar",
  "oral glucose tolerance test": "Oral Glucose Tolerance Test",
  ogtt: "Oral Glucose Tolerance Test",
  "glucose tolerance test": "Oral Glucose Tolerance Test",
  "hemoglobin a1c": "Hemoglobin A1C",
  hba1c: "Hemoglobin A1C",
  a1c: "Hemoglobin A1C",
  "glycated hemoglobin": "Hemoglobin A1C",
  "glycosylated hemoglobin": "Hemoglobin A1C",
  creatinine: "Creatinine",
  crea: "Creatinine",
  cre: "Creatinine",
  "serum creatinine": "Creatinine",
  "blood urea nitrogen": "Blood Urea Nitrogen",
  bun: "Blood Urea Nitrogen",
  "urea nitrogen": "Blood Urea Nitrogen",
  urea: "Blood Urea Nitrogen",
  "estimated gfr": "Estimated GFR",
  egfr: "Estimated GFR",
  gfr: "Estimated GFR",
  "glomerular filtration rate": "Estimated GFR",
  "uric acid": "Uric Acid",
  "serum uric acid": "Uric Acid",
  "total protein": "Total Protein",
  "serum total protein": "Total Protein",
  albumin: "Albumin",
  alb: "Albumin",
  "serum albumin": "Albumin",
  globulin: "Globulin",
  "a/g ratio": "A/G Ratio",
  "ag ratio": "A/G Ratio",
  "albumin globulin ratio": "A/G Ratio",
  sodium: "Sodium",
  na: "Sodium",
  "serum sodium": "Sodium",
  potassium: "Potassium",
  "serum potassium": "Potassium",
  chloride: "Chloride",
  "serum chloride": "Chloride",
  bicarbonate: "Bicarbonate",
  hco3: "Bicarbonate",
  "total co2": "Bicarbonate",
  calcium: "Calcium",
  "serum calcium": "Calcium",
  "total calcium": "Calcium",
  "ionized calcium": "Ionized Calcium",
  "free calcium": "Ionized Calcium",
  phosphorus: "Phosphorus",
  phosphate: "Phosphorus",
  "inorganic phosphorus": "Phosphorus",
  magnesium: "Magnesium",
  "serum magnesium": "Magnesium",

  // Lipid Profile
  "total cholesterol": "Total Cholesterol",
  cholesterol: "Total Cholesterol",
  chol: "Total Cholesterol",
  "ldl cholesterol": "LDL Cholesterol",
  ldl: "LDL Cholesterol",
  "ldl-c": "LDL Cholesterol",
  "low density lipoprotein": "LDL Cholesterol",
  "hdl cholesterol": "HDL Cholesterol",
  hdl: "HDL Cholesterol",
  "hdl-c": "HDL Cholesterol",
  "high density lipoprotein": "HDL Cholesterol",
  "vldl cholesterol": "VLDL Cholesterol",
  vldl: "VLDL Cholesterol",
  "very low density lipoprotein": "VLDL Cholesterol",
  triglycerides: "Triglycerides",
  trig: "Triglycerides",
  triglyceride: "Triglycerides",
  "cholesterol hdl ratio": "Cholesterol HDL Ratio",
  "chol/hdl ratio": "Cholesterol HDL Ratio",

  // Liver Function
  ast: "AST",
  sgot: "AST",
  "aspartate aminotransferase": "AST",
  alt: "ALT",
  sgpt: "ALT",
  "alanine aminotransferase": "ALT",
  "alkaline phosphatase": "Alkaline Phosphatase",
  alp: "Alkaline Phosphatase",
  "alk phos": "Alkaline Phosphatase",
  "gamma-glutamyl transferase": "Gamma-Glutamyl Transferase",
  ggt: "Gamma-Glutamyl Transferase",
  "gamma gt": "Gamma-Glutamyl Transferase",
  "total bilirubin": "Total Bilirubin",
  "bilirubin total": "Total Bilirubin",
  "total bili": "Total Bilirubin",
  "direct bilirubin": "Direct Bilirubin",
  "conjugated bilirubin": "Direct Bilirubin",
  "indirect bilirubin": "Indirect Bilirubin",
  "unconjugated bilirubin": "Indirect Bilirubin",
  "lactate dehydrogenase": "Lactate Dehydrogenase",
  ldh: "Lactate Dehydrogenase",

  // Cardiac and Pancreatic
  troponin: "Troponin",
  "troponin i": "Troponin",
  "troponin t": "Troponin",
  "creatine kinase": "Creatine Kinase",
  cpk: "Creatine Kinase",
  "ck-mb": "CK-MB",
  ckmb: "CK-MB",
  "creatine kinase mb": "CK-MB",
  bnp: "BNP",
  "nt-probnp": "BNP",
  "brain natriuretic peptide": "BNP",
  amylase: "Amylase",
  "serum amylase": "Amylase",
  lipase: "Lipase",
  "serum lipase": "Lipase",

  // Thyroid
  tsh: "TSH",
  "thyroid stimulating hormone": "TSH",
  thyrotropin: "TSH",
  t3: "T3",
  triiodothyronine: "T3",
  "total t3": "T3",
  t4: "T4",
  thyroxine: "T4",
  "total t4": "T4",
  "free t3": "Free T3",
  ft3: "Free T3",
  "free t4": "Free T4",
  ft4: "Free T4",
  "anti-tpo": "Anti-TPO",
  "thyroid peroxidase antibody": "Anti-TPO",

  // Coagulation
  "prothrombin time": "Prothrombin Time",
  protime: "Prothrombin Time",
  inr: "INR",
  "international normalized ratio": "INR",
  "partial thromboplastin time": "Partial Thromboplastin Time",
  ptt: "Partial Thromboplastin Time",
  aptt: "Partial Thromboplastin Time",
  "activated ptt": "Partial Thromboplastin Time",
  fibrinogen: "Fibrinogen",
  "d-dimer": "D-Dimer",
  "d dimer": "D-Dimer",
  ddimer: "D-Dimer",
  "bleeding time": "Bleeding Time",
  "clotting time": "Clotting Time",

  // Serology
  "c-reactive protein": "C-Reactive Protein",
  crp: "C-Reactive Protein",
  "hs-crp": "C-Reactive Protein",
  procalcitonin: "Procalcitonin",
  "antistreptolysin o": "Antistreptolysin O",
  aso: "Antistreptolysin O",
  "aso titer": "Antistreptolysin O",
  "rheumatoid factor": "Rheumatoid Factor",
  "antinuclear antibody": "Antinuclear Antibody",
  ana: "Antinuclear Antibody",
  "dengue ns1": "Dengue NS1",
  "ns1 antigen": "Dengue NS1",
  "dengue ns1 antigen": "Dengue NS1",
  "dengue igg": "Dengue IgG",
  "dengue igm": "Dengue IgM",
  "widal test": "Widal Test",
  widal: "Widal Test",
  typhidot: "Widal Test",
  "hepatitis b surface antigen": "Hepatitis B Surface Antigen",
  hbsag: "Hepatitis B Surface Antigen",
  "hbs ag": "Hepatitis B Surface Antigen",
  "anti-hbs": "Anti-HBs",
  hbsab: "Anti-HBs",
  "hepatitis b surface antibody": "Anti-HBs",
  "anti-hcv": "Anti-HCV",
  "hepatitis c antibody": "Anti-HCV",
  hcv: "Anti-HCV",
  "hepatitis a igm": "Hepatitis A IgM",
  "hav igm": "Hepatitis A IgM",
  hiv: "HIV",
  "hiv screening": "HIV",
  "anti-hiv": "HIV",
  vdrl: "VDRL",
  rpr: "VDRL",
  "syphilis screening": "VDRL",
  "helicobacter pylori": "Helicobacter pylori",
  "h. pylori": "Helicobacter pylori",
  "h pylori": "Helicobacter pylori",
  "covid-19 rt-pcr": "COVID-19 RT-PCR",
  "sars-cov-2 rt-pcr": "COVID-19 RT-PCR",

  // Tumor Markers and Vitamins
  psa: "PSA",
  "prostate specific antigen": "PSA",
  cea: "CEA",
  "carcinoembryonic antigen": "CEA",
  "alpha-fetoprotein": "Alpha-Fetoprotein",
  afp: "Alpha-Fetoprotein",
  "ca 125": "CA 125",
  "ca-125": "CA 125",
  ca125: "CA 125",
  "ca 19-9": "CA 19-9",
  "ca19-9": "CA 19-9",
  "vitamin d": "Vitamin D",
  "25-oh vitamin d": "Vitamin D",
  "vitamin b12": "Vitamin B12",
  b12: "Vitamin B12",
  cobalamin: "Vitamin B12",
  folate: "Folate",
  "folic acid": "Folate",
  ferritin: "Ferritin",
  "serum ferritin": "Ferritin",
  iron: "Iron",
  "serum iron": "Iron",
  "total iron binding capacity": "Total Iron Binding Capacity",
  tibc: "Total Iron Binding Capacity",
  transferrin: "Transferrin",
  "transferrin saturation": "Transferrin",

  // Other
  "blood type": "Blood Type",
  "blood typing": "Blood Type",
  "abo typing": "Blood Type",
  "abo rh": "Blood Type",
  "rh factor": "Rh Factor",
  "rh typing": "Rh Factor",
  "rhesus factor": "Rh Factor",
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
  // Microscopy counts reported as a span, e.g. "Pus Cells: 5-10 /hpf".
  {
    re: /^([A-Za-z\s\-/()]+?):\s*(\d+\s*-\s*\d+)\s*([A-Za-z/]+)?$/,
    nameIdx: 1,
    valueIdx: 2,
    unitIdx: 3,
  },
  // Qualitative results, e.g. "Occult Blood: Positive", "Urine Color: Yellow".
  {
    re: /^([A-Za-z\s\-/()]+?):\s*([A-Za-z][A-Za-z\s()+-]{0,29})$/,
    nameIdx: 1,
    valueIdx: 2,
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
 * Canonical names, plus the values they normalise to, form the allowlist of
 * things this engine will call a lab result.
 *
 * Without it any "Label: number" line parsed as a test, so `Patient ID: 12345`,
 * `Age: 45` and `Room No: 302` became "lab results" — PHI that then flowed into
 * the analysis, the audit trail and user-facing text.
 */
const KNOWN_TEST_KEYS = new Set<string>([
  ...Object.keys(CANONICAL_TEST_NAMES),
  ...Object.values(CANONICAL_TEST_NAMES).map((value) => value.toLowerCase()),
]);

const isKnownTestName = (name: string): boolean =>
  KNOWN_TEST_KEYS.has(name.trim().toLowerCase());

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

      const rawName = match[pattern.nameIdx] ?? "";
      // Only recognised analytes may become results; everything else on the
      // page (patient id, age, room number, ...) is PHI, not a measurement.
      if (!isKnownTestName(rawName)) continue;

      const name = normalizeName(rawName);
      const value = match[pattern.valueIdx] ?? "";
      const unit =
        pattern.unitIdx === undefined ? "" : (match[pattern.unitIdx] ?? "");
      const referenceRange =
        pattern.rangeIdx === undefined ? undefined : match[pattern.rangeIdx];

      // Skip duplicate names
      const nameKey = name.toLowerCase();
      if (seenNames.has(nameKey)) break;
      seenNames.add(nameKey);

      // Prefer the range printed on the document; fall back to the built-in
      // table so a value without a printed range is still checked.
      const printedRange = referenceRange?.trim();
      const builtIn = printedRange
        ? undefined
        : REFERENCE_RANGES[CANONICAL_NAME_TO_CODE[name] ?? ""];
      const effectiveRange =
        printedRange ??
        (builtIn ? `${builtIn.low}-${builtIn.high}` : undefined);

      results.push({
        name,
        value,
        unit: unit.trim() || (printedRange ? "" : (builtIn?.unit ?? "")),
        referenceRange: effectiveRange,
        flagged: computeFlag(value, effectiveRange ?? ""),
      });

      break; // Move to next line after successful pattern match
    }
  }

  return results;
};
