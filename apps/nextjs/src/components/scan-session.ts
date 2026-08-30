/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

export const SCAN_SESSION_KEY = "scanAnalysisSession";

export interface ScanAnalysisSession {
  requestId: string;
  status: "completed" | "error" | "pending";
  source?: "mock" | "llm" | "fallback" | "raw" | "gemini";
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

/**
 * How long a scan hand-off may sit in sessionStorage before it is discarded.
 *
 * This record carries extracted medical values, so it is deliberately
 * short-lived. sessionStorage is per-tab and dies with the tab, so it is not
 * database, object-store or disk persistence — but it is still health data,
 * and it should not outlive the visit that produced it.
 */
export const SCAN_SESSION_TTL_MS = 30 * 60 * 1000;

/**
 * Persist the scan hand-off for the current tab.
 *
 * Never throws: sessionStorage is unavailable in Safari private mode, can be
 * disabled by policy, and can exceed quota on a large extractedData payload.
 * Callers get the normalized record back regardless so the UI can continue.
 */
export function saveScanAnalysisSession(
  payload: RawScanPayload,
): ScanAnalysisSession {
  const normalized = normalizeScanAnalysisSession(payload);

  try {
    sessionStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(normalized));
  } catch {
    // Storage unavailable or full — the caller still has the value in memory.
  }

  return normalized;
}

export function readScanAnalysisSession(): ScanAnalysisSession | null {
  let stored: string | null = null;

  try {
    stored = sessionStorage.getItem(SCAN_SESSION_KEY);
  } catch {
    return null;
  }

  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as ScanAnalysisSession;

    // Drop stale hand-offs rather than letting medical values linger.
    const savedAt = parsed.timestamp ? Date.parse(parsed.timestamp) : NaN;
    if (Number.isFinite(savedAt) && Date.now() - savedAt > SCAN_SESSION_TTL_MS) {
      clearScanAnalysisSession();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearScanAnalysisSession() {
  try {
    sessionStorage.removeItem(SCAN_SESSION_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
