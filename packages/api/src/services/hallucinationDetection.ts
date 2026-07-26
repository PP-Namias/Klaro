/**
 * Hallucination Detection Service
 *
 * AI-01: Implement hallucination detection and confidence scoring for medical extractions.
 *
 * Detects potential AI hallucinations by:
 * 1. Validating extracted values against medical plausibility ranges
 * 2. Checking for impossible combinations
 * 3. Cross-referencing OCR text with extracted data
 * 4. Scoring overall confidence based on multiple factors
 *
 * Based on medical knowledge bases and common lab reference ranges.
 */

// ============================================================================
// Types
// ============================================================================

export type HallucinationSeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface HallucinationCheck {
  /** Type of check performed */
  type: string;
  /** Severity if hallucination detected */
  severity: HallucinationSeverity;
  /** Description of the issue */
  description: string;
  /** The problematic value */
  value?: string;
  /** Expected valid range */
  expectedRange?: string;
  /** Confidence penalty (0-1) */
  confidencePenalty: number;
}

export interface HallucinationResult {
  /** Overall hallucination score (0 = no hallucinations, 1 = all hallucinated) */
  score: number;
  /** Adjusted confidence after hallucination check */
  adjustedConfidence: number;
  /** List of detected hallucinations */
  hallucinations: HallucinationCheck[];
  /** Whether the data requires manual review */
  requiresReview: boolean;
  /** Summary message */
  summary: string;
}

export interface MedicalPlausibilityRule {
  /** Test name (canonical) */
  testName: string;
  /** Minimum plausible value */
  min: number;
  /** Maximum plausible value */
  max: number;
  /** Common units */
  units: string[];
  /** Reference range for flagging */
  referenceRange?: { low: number; high: number };
}

// ============================================================================
// Medical Plausibility Database
// ============================================================================

/**
 * Reference ranges and plausible value ranges for common lab tests
 * Values outside these ranges are flagged as potential hallucinations
 */
const PLAUSIBILITY_RULES: MedicalPlausibilityRule[] = [
  // Hematology
  {
    testName: "Hemoglobin",
    min: 2,
    max: 25,
    units: ["g/dL", "g/L"],
    referenceRange: { low: 12, high: 17.5 },
  },
  {
    testName: "Hemoglobin A1C",
    min: 3,
    max: 20,
    units: ["%"],
    referenceRange: { low: 4, high: 5.7 },
  },
  {
    testName: "Red Blood Cell Count",
    min: 0.5,
    max: 10,
    units: ["M/µL", "10^6/µL"],
    referenceRange: { low: 4.5, high: 5.5 },
  },
  {
    testName: "White Blood Cell Count",
    min: 0.1,
    max: 100,
    units: ["K/µL", "10^3/µL"],
    referenceRange: { low: 4.5, high: 11 },
  },
  {
    testName: "Platelet Count",
    min: 10,
    max: 1000,
    units: ["K/µL", "10^3/µL"],
    referenceRange: { low: 150, high: 400 },
  },
  {
    testName: "Hematocrit",
    min: 5,
    max: 70,
    units: ["%"],
    referenceRange: { low: 36, high: 48 },
  },
  {
    testName: "MCV",
    min: 50,
    max: 120,
    units: ["fL"],
    referenceRange: { low: 80, high: 100 },
  },
  {
    testName: "MCH",
    min: 20,
    max: 45,
    units: ["pg"],
    referenceRange: { low: 27, high: 33 },
  },
  {
    testName: "MCHC",
    min: 25,
    max: 40,
    units: ["g/dL"],
    referenceRange: { low: 32, high: 36 },
  },
  {
    testName: "RDW",
    min: 5,
    max: 30,
    units: ["%"],
    referenceRange: { low: 11.5, high: 14.5 },
  },

  // Blood Chemistry
  {
    testName: "Fasting Blood Glucose",
    min: 20,
    max: 800,
    units: ["mg/dL"],
    referenceRange: { low: 70, high: 100 },
  },
  {
    testName: "Total Cholesterol",
    min: 50,
    max: 600,
    units: ["mg/dL"],
    referenceRange: { low: 0, high: 200 },
  },
  {
    testName: "LDL Cholesterol",
    min: 20,
    max: 400,
    units: ["mg/dL"],
    referenceRange: { low: 0, high: 100 },
  },
  {
    testName: "HDL Cholesterol",
    min: 10,
    max: 150,
    units: ["mg/dL"],
    referenceRange: { low: 40, high: 60 },
  },
  {
    testName: "Triglycerides",
    min: 20,
    max: 2000,
    units: ["mg/dL"],
    referenceRange: { low: 0, high: 150 },
  },

  // Kidney Function
  {
    testName: "Creatinine",
    min: 0.1,
    max: 20,
    units: ["mg/dL"],
    referenceRange: { low: 0.7, high: 1.3 },
  },
  {
    testName: "Blood Urea Nitrogen",
    min: 1,
    max: 150,
    units: ["mg/dL"],
    referenceRange: { low: 7, high: 20 },
  },
  {
    testName: "eGFR",
    min: 0,
    max: 200,
    units: ["mL/min/1.73m²"],
    referenceRange: { low: 60, high: 120 },
  },

  // Electrolytes
  {
    testName: "Sodium",
    min: 100,
    max: 200,
    units: ["mEq/L", "mmol/L"],
    referenceRange: { low: 136, high: 145 },
  },
  {
    testName: "Potassium",
    min: 1,
    max: 10,
    units: ["mEq/L", "mmol/L"],
    referenceRange: { low: 3.5, high: 5 },
  },
  {
    testName: "Chloride",
    min: 80,
    max: 150,
    units: ["mEq/L", "mmol/L"],
    referenceRange: { low: 98, high: 106 },
  },
  {
    testName: "Calcium",
    min: 4,
    max: 20,
    units: ["mg/dL", "mmol/L"],
    referenceRange: { low: 8.5, high: 10.5 },
  },

  // Liver Function
  {
    testName: "AST",
    min: 0,
    max: 5000,
    units: ["U/L"],
    referenceRange: { low: 10, high: 40 },
  },
  {
    testName: "ALT",
    min: 0,
    max: 5000,
    units: ["U/L"],
    referenceRange: { low: 7, high: 56 },
  },
  {
    testName: "Alkaline Phosphatase",
    min: 0,
    max: 1000,
    units: ["U/L"],
    referenceRange: { low: 44, high: 147 },
  },
  {
    testName: "Total Bilirubin",
    min: 0,
    max: 50,
    units: ["mg/dL"],
    referenceRange: { low: 0.1, high: 1.2 },
  },
  {
    testName: "Albumin",
    min: 0.5,
    max: 8,
    units: ["g/dL"],
    referenceRange: { low: 3.5, high: 5.0 },
  },

  // Thyroid
  {
    testName: "TSH",
    min: 0.01,
    max: 100,
    units: ["mIU/L"],
    referenceRange: { low: 0.4, high: 4.0 },
  },
  {
    testName: "Free T4",
    min: 0.1,
    max: 10,
    units: ["ng/dL"],
    referenceRange: { low: 0.8, high: 1.8 },
  },

  // Cardiac
  {
    testName: "Troponin I",
    min: 0,
    max: 100,
    units: ["ng/mL"],
    referenceRange: { low: 0, high: 0.04 },
  },
  {
    testName: "BNP",
    min: 0,
    max: 5000,
    units: ["pg/mL"],
    referenceRange: { low: 0, high: 100 },
  },
  {
    testName: "CRP",
    min: 0,
    max: 500,
    units: ["mg/L"],
    referenceRange: { low: 0, high: 3 },
  },
];

// ============================================================================
// Plausibility Checks
// ============================================================================

/**
 * Check if a value is within plausible medical range
 */
function checkValuePlausibility(
  testName: string,
  value: string,
  _unit?: string,
): HallucinationCheck | null {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    // Non-numeric value - check if it's a valid text result
    return null;
  }

  // Find matching rule
  const rule = PLAUSIBILITY_RULES.find(
    (r) =>
      r.testName.toLowerCase() === testName.toLowerCase() ||
      r.testName.toLowerCase().includes(testName.toLowerCase()),
  );

  if (!rule) {
    // No rule found - can't validate
    return null;
  }

  // Check if value is outside plausible range
  if (numericValue < rule.min || numericValue > rule.max) {
    return {
      type: "value_out_of_plausible_range",
      severity: "high",
      description: `Value ${numericValue} is outside plausible range for ${testName} (${rule.min}-${rule.max})`,
      value,
      expectedRange: `${rule.min}-${rule.max} ${rule.units[0]}`,
      confidencePenalty: 0.3,
    };
  }

  // Check if value is outside reference range (flagged but not hallucination)
  if (rule.referenceRange) {
    if (
      numericValue < rule.referenceRange.low ||
      numericValue > rule.referenceRange.high
    ) {
      // This is a legitimate abnormal value, not a hallucination
      return null;
    }
  }

  return null;
}

/**
 * Check for impossible combinations of test results
 */
function checkImpossibleCombinations(
  tests: Array<{ name: string; value: string; unit?: string }>,
): HallucinationCheck[] {
  const hallucinations: HallucinationCheck[] = [];
  const testMap = new Map(
    tests.map((t) => [t.name.toLowerCase(), parseFloat(t.value)]),
  );

  // Check: High hemoglobin + Low hematocrit (physiologically inconsistent)
  const hgb = testMap.get("hemoglobin");
  const hct = testMap.get("hematocrit");
  if (hgb !== undefined && hct !== undefined) {
    const expectedHct = hgb * 3; // Rough approximation
    if (Math.abs(hct - expectedHct) > 15) {
      hallucinations.push({
        type: "impossible_combination",
        severity: "medium",
        description: `Hemoglobin (${hgb}) and Hematocrit (${hct}) are physiologically inconsistent`,
        confidencePenalty: 0.15,
      });
    }
  }

  // Check: High glucose + Low insulin (possible but rare - flag for review)
  const glucose = testMap.get("fasting blood glucose");
  if (glucose !== undefined && glucose > 300) {
    hallucinations.push({
      type: "extreme_value",
      severity: "low",
      description: `Extremely high glucose (${glucose}) - verify accuracy`,
      confidencePenalty: 0.05,
    });
  }

  // Check: Negative values where impossible
  for (const test of tests) {
    const value = parseFloat(test.value);
    if (!isNaN(value) && value < 0) {
      const negativeAllowed = ["BUN", "Creatinine", "eGFR"].includes(test.name);
      if (!negativeAllowed) {
        hallucinations.push({
          type: "negative_value",
          severity: "high",
          description: `Negative value for ${test.name} (${value}) is impossible`,
          value: test.value,
          confidencePenalty: 0.25,
        });
      }
    }
  }

  return hallucinations;
}

/**
 * Cross-reference extracted data with OCR text
 */
function checkOcrConsistency(
  ocrText: string,
  extractedTests: Array<{ name: string; value: string }>,
): HallucinationCheck[] {
  const hallucinations: HallucinationCheck[] = [];
  const ocrLower = ocrText.toLowerCase();

  for (const test of extractedTests) {
    // Check if test name appears in OCR text
    const testNameLower = test.name.toLowerCase();
    if (!ocrLower.includes(testNameLower)) {
      // Test name not found in OCR - potential hallucination
      hallucinations.push({
        type: "ocr_mismatch",
        severity: "medium",
        description: `Test "${test.name}" was extracted but not found in OCR text`,
        confidencePenalty: 0.2,
      });
    }

    // Check if value appears in OCR text
    if (!ocrLower.includes(test.value.toLowerCase())) {
      hallucinations.push({
        type: "value_not_in_ocr",
        severity: "low",
        description: `Value "${test.value}" for ${test.name} not found in OCR text`,
        confidencePenalty: 0.1,
      });
    }
  }

  return hallucinations;
}

/**
 * Check for duplicate tests with different values
 */
function checkDuplicateTests(
  tests: Array<{ name: string; value: string }>,
): HallucinationCheck[] {
  const hallucinations: HallucinationCheck[] = [];
  const testCounts = new Map<string, string[]>();

  for (const test of tests) {
    const key = test.name.toLowerCase();
    const values = testCounts.get(key) || [];
    values.push(test.value);
    testCounts.set(key, values);
  }

  for (const [name, values] of testCounts) {
    if (values.length > 1) {
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        hallucinations.push({
          type: "duplicate_conflicting",
          severity: "high",
          description: `Duplicate test "${name}" with conflicting values: ${uniqueValues.join(", ")}`,
          confidencePenalty: 0.25,
        });
      }
    }
  }

  return hallucinations;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect potential hallucinations in extracted medical data
 */
export function detectHallucinations(
  ocrText: string,
  extractedData: {
    tests: Array<{ name: string; value: string; unit?: string }>;
    diagnosis?: string[];
    medications?: Array<{ name: string; dosage?: string }>;
  },
  originalConfidence: number,
): HallucinationResult {
  const allChecks: HallucinationCheck[] = [];

  // 1. Check each test value for plausibility
  for (const test of extractedData.tests) {
    const check = checkValuePlausibility(test.name, test.value, test.unit);
    if (check) {
      allChecks.push(check);
    }
  }

  // 2. Check for impossible combinations
  const impossibleChecks = checkImpossibleCombinations(extractedData.tests);
  allChecks.push(...impossibleChecks);

  // 3. Cross-reference with OCR text
  const ocrChecks = checkOcrConsistency(ocrText, extractedData.tests);
  allChecks.push(...ocrChecks);

  // 4. Check for duplicate/conflicting tests
  const duplicateChecks = checkDuplicateTests(extractedData.tests);
  allChecks.push(...duplicateChecks);

  // Calculate overall hallucination score
  const totalPenalty = allChecks.reduce(
    (sum, c) => sum + c.confidencePenalty,
    0,
  );
  const hallucinationScore = Math.min(1, totalPenalty);

  // Adjust confidence
  const adjustedConfidence = Math.max(
    0,
    originalConfidence * (1 - hallucinationScore),
  );

  // Determine if manual review is required
  const highSeverityCount = allChecks.filter(
    (c) => c.severity === "high" || c.severity === "critical",
  ).length;
  const requiresReview = highSeverityCount >= 2 || hallucinationScore > 0.4;

  // Generate summary
  let summary: string;
  if (allChecks.length === 0) {
    summary = "No potential hallucinations detected. Data appears consistent.";
  } else if (requiresReview) {
    summary = `${allChecks.length} potential issues detected. Manual review recommended.`;
  } else {
    summary = `${allChecks.length} minor inconsistencies detected. Data may be reliable.`;
  }

  return {
    score: hallucinationScore,
    adjustedConfidence,
    hallucinations: allChecks,
    requiresReview,
    summary,
  };
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: HallucinationSeverity): string {
  switch (severity) {
    case "none":
      return "green";
    case "low":
      return "yellow";
    case "medium":
      return "orange";
    case "high":
      return "red";
    case "critical":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Format hallucination check for display
 */
export function formatHallucinationCheck(check: HallucinationCheck): string {
  const parts = [`[${check.severity.toUpperCase()}] ${check.description}`];
  if (check.value) parts.push(`Value: ${check.value}`);
  if (check.expectedRange) parts.push(`Expected: ${check.expectedRange}`);
  return parts.join(" | ");
}
