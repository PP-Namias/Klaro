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

export const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  HGB: { low: 12, high: 16, unit: "g/dL" },
  HCT: { low: 36, high: 46, unit: "%" },
  RBC: { low: 4, high: 5.5, unit: "million/uL" },
  WBC: { low: 4500, high: 11000, unit: "/uL" },
  PLT: { low: 150000, high: 400000, unit: "/uL" },
  GLU: { low: 70, high: 100, unit: "mg/dL" },
  BUN: { low: 7, high: 20, unit: "mg/dL" },
  CRE: { low: 0.6, high: 1.2, unit: "mg/dL" },
  CHOL: { low: 0, high: 200, unit: "mg/dL" },
  HDL: { low: 40, high: 60, unit: "mg/dL" },
  LDL: { low: 0, high: 100, unit: "mg/dL" },
  TG: { low: 0, high: 150, unit: "mg/dL" },
  ALT: { low: 7, high: 56, unit: "U/L" },
  AST: { low: 10, high: 40, unit: "U/L" },
  UA: { low: 2.4, high: 7, unit: "mg/dL" },
  TSH: { low: 0.4, high: 4, unit: "mIU/L" },
  NA: { low: 136, high: 145, unit: "mEq/L" },
  K: { low: 3.5, high: 5, unit: "mEq/L" },
  CL: { low: 98, high: 106, unit: "mEq/L" },
  CA: { low: 8.5, high: 10.5, unit: "mg/dL" },
  MG: { low: 1.7, high: 2.2, unit: "mg/dL" },
};

export function calculateSeverity(
  testCode: string,
  value: number,
): SeverityResult {
  const range = REFERENCE_RANGES[testCode.toUpperCase()];

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

  if (value >= range.low && value <= range.high) {
    severity = "normal";
    message = "Within normal range";
  } else if (value < range.low * 0.8 || value > range.high * 1.2) {
    severity = "critical";
    message =
      value < range.low
        ? `Critically low (normal: ${range.low}-${range.high} ${range.unit})`
        : `Critically high (normal: ${range.low}-${range.high} ${range.unit})`;
  } else if (value < range.low || value > range.high) {
    severity = "high";
    message =
      value < range.low
        ? `Below normal (normal: ${range.low}-${range.high} ${range.unit})`
        : `Above normal (normal: ${range.low}-${range.high} ${range.unit})`;
  } else {
    severity = "borderline";
    message = `Borderline (normal: ${range.low}-${range.high} ${range.unit})`;
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
  tests: Array<{ code: string; value: number }>,
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
