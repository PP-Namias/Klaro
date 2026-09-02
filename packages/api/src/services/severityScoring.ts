import type { PatientContext } from "./referenceRanges";
import { lookupRange, REFERENCE_ENTRIES } from "./referenceRanges";

export type SeverityLevel = "normal" | "borderline" | "high" | "critical";

export interface SeverityResult {
  testCode: string;
  value: number;
  unit: string;
  severity: SeverityLevel;
  message: string;
  color: string;
  icon: string;
}

export interface ReferenceRange {
  low: number;
  high: number;
  unit: string;
}

/**
 * Adult reference ranges, derived from the single canonical table in
 * referenceRanges.ts. Kept as an exported record for backwards compatibility;
 * new code should call lookupRange() so age and sex are taken into account.
 */
export const REFERENCE_RANGES: Record<string, ReferenceRange> =
  Object.fromEntries(
    REFERENCE_ENTRIES.map((entry) => {
      const general =
        entry.ranges.find((band) => !band.sex && band.minAge === undefined) ??
        entry.ranges[0];
      return [
        entry.code,
        {
          low: general?.low ?? 0,
          high: general?.high ?? 0,
          unit: entry.unit,
        },
      ];
    }),
  );

export function calculateSeverity(
  testCode: string,
  value: number,
  context: PatientContext = {},
): SeverityResult {
  const resolved = lookupRange(testCode, context);
  const range = resolved
    ? { low: resolved.low, high: resolved.high, unit: resolved.unit }
    : undefined;

  if (!range) {
    return {
      testCode,
      value,
      unit: "",
      severity: "normal",
      message: "No reference range available",
      color: "#6B7280",
      icon: "❓",
    };
  }

  let severity: SeverityLevel;
  let message: string;

  // Bands, from the range outwards. "borderline" previously sat in a trailing
  // else that no value could reach, because the preceding branches already
  // covered both in-range and out-of-range, so results were only ever normal,
  // high or critical.
  const window = `normal: ${range.low}-${range.high} ${range.unit}`;

  if (value >= range.low && value <= range.high) {
    severity = "normal";
    message = "Within normal range";
  } else if (value < range.low * 0.8 || value > range.high * 1.2) {
    severity = "critical";
    message =
      value < range.low
        ? `Critically low (${window})`
        : `Critically high (${window})`;
  } else if (value >= range.low * 0.9 && value <= range.high * 1.1) {
    // Just outside the range — worth noting, not alarming.
    severity = "borderline";
    message =
      value < range.low
        ? `Slightly below normal (${window})`
        : `Slightly above normal (${window})`;
  } else {
    severity = "high";
    message =
      value < range.low
        ? `Below normal (${window})`
        : `Above normal (${window})`;
  }

  return {
    testCode,
    value,
    unit: range.unit,
    severity,
    message,
    color: getSeverityColor(severity),
    icon: getSeverityIcon(severity),
  };
}

export function getSeverityColor(severity: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    normal: "#10B981",
    borderline: "#F59E0B",
    high: "#EF4444",
    critical: "#DC2626",
  };
  return colors[severity];
}

export function getSeverityIcon(severity: SeverityLevel): string {
  const icons: Record<SeverityLevel, string> = {
    normal: "✅",
    borderline: "⚠️",
    high: "🔴",
    critical: "🚨",
  };
  return icons[severity];
}

export function batchCalculateSeverity(
  tests: { code: string; value: number }[],
): SeverityResult[] {
  return tests.map((test) => calculateSeverity(test.code, test.value));
}

export function hasCriticalValues(results: SeverityResult[]): boolean {
  return results.some((r) => r.severity === "critical");
}

export function hasHighValues(results: SeverityResult[]): boolean {
  return results.some(
    (r) => r.severity === "high" || r.severity === "critical",
  );
}

export function getOverallSeverity(results: SeverityResult[]): SeverityLevel {
  if (hasCriticalValues(results)) return "critical";
  if (hasHighValues(results)) return "high";

  const hasBorderline = results.some((r) => r.severity === "borderline");
  if (hasBorderline) return "borderline";

  return "normal";
}
