// ============================================================================
// Medical Plausibility Database
// ============================================================================

/**
 * Reference ranges and plausible value ranges for common lab tests
 * Values outside these ranges are flagged as potential hallucinations
 */
import { REFERENCE_ENTRIES } from "./referenceRanges";

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

/**
 * Plausibility rules, derived from the single canonical table in
 * referenceRanges.ts. This module used to carry its own copy, which disagreed
 * with severityScoring on HGB, HCT, RBC and CRE — the same value could be
 * "normal" on one path and "abnormal" on the other.
 */
const PLAUSIBILITY_RULES: MedicalPlausibilityRule[] = REFERENCE_ENTRIES.map(
  (entry) => {
    const general =
      entry.ranges.find((band) => !band.sex && band.minAge === undefined) ??
      entry.ranges[0];
    return {
      testName: entry.name,
      min: entry.min,
      max: entry.max,
      units: entry.units,
      referenceRange: general
        ? { low: general.low, high: general.high }
        : undefined,
    };
  },
);

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
  tests: { name: string; value: string; unit?: string }[],
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
  extractedTests: { name: string; value: string }[],
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
  tests: { name: string; value: string }[],
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
    tests: { name: string; value: string; unit?: string }[];
    diagnosis?: string[];
    medications?: { name: string; dosage?: string }[];
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
