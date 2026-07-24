/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

export const SCAN_SESSION_KEY = "scanAnalysisSession";

export interface ScanAnalysisSession {
  requestId: string;
  status: "completed" | "error" | "pending";
  source?: "mock" | "llm" | "fallback" | "raw";
  language?: string;
  confidence?: number;
  extractedData?: Record<string, unknown>;
  plainLanguageSummary?: string;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  recommendations?: string[];
  warnings?: string[];
  timestamp?: string;
  error?: string;
  analysis?: {
    summary: string;
    urgency: "LOW" | "MODERATE" | "HIGH";
    recommendations: string[];
  };
}

export interface RawScanPayload {
  requestId?: string;
  status?: string;
  source?: ScanAnalysisSession["source"];
  language?: string;
  confidence?: number;
  extractedData?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  plainLanguageSummary?: string;
  urgency?: string;
  recommendations?: string[];
  warnings?: string[];
  timestamp?: string;
  error?: string;
  analysis?: ScanAnalysisSession["analysis"];
}

function normalizeUrgency(value: unknown): "LOW" | "MODERATE" | "HIGH" {
  if (value === "LOW" || value === "MODERATE" || value === "HIGH") {
    return value;
  }
  return "MODERATE";
}

function normalizeLanguage(value: unknown): "Filipino" | "English" | undefined {
  if (value === "Filipino" || value === "English") {
    return value;
  }
  return undefined;
}

export function normalizeScanAnalysisSession(
  payload: RawScanPayload,
): ScanAnalysisSession {
  const extractedData = payload.extractedData || payload.fields || {};
  const analysis = payload.analysis;
  const plainLanguageSummary =
    payload.plainLanguageSummary || analysis?.summary || "";
  const urgency = normalizeUrgency(payload.urgency || analysis?.urgency);
  const recommendations = Array.isArray(payload.recommendations)
    ? payload.recommendations
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : Array.isArray(analysis?.recommendations)
      ? analysis.recommendations
      : [];

  const hasResultContent =
    plainLanguageSummary.trim().length > 0 || recommendations.length > 0;

  const normalizedStatus: ScanAnalysisSession["status"] =
    payload.status === "completed" ||
    payload.status === "error" ||
    payload.status === "pending"
      ? payload.status
      : payload.error
        ? "error"
        : hasResultContent
          ? "completed"
          : "pending";

  return {
    requestId: payload.requestId || `scan-${Date.now()}`,
    status: normalizedStatus,
    source: payload.source || "raw",
    language: normalizeLanguage(payload.language),
    confidence:
      typeof payload.confidence === "number" &&
      payload.confidence >= 0 &&
      payload.confidence <= 1
        ? payload.confidence
        : undefined,
    extractedData,
    plainLanguageSummary,
    urgency,
    recommendations,
    warnings: Array.isArray(payload.warnings)
      ? payload.warnings.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    timestamp: payload.timestamp || new Date().toISOString(),
    error: payload.error,
    analysis:
      analysis || hasResultContent
        ? {
            summary: plainLanguageSummary || "Scan is processing",
            urgency,
            recommendations,
          }
        : undefined,
  };
}

export function saveScanAnalysisSession(payload: RawScanPayload) {
  const normalized = normalizeScanAnalysisSession(payload);
  sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

export function readScanAnalysisSession(): ScanAnalysisSession | null {
  const stored = sessionStorage.getItem(SCAN_SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ScanAnalysisSession;
  } catch {
    return null;
  }
}

export function clearScanAnalysisSession() {
  sessionStorage.removeItem(SCAN_SESSION_KEY);
}
