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

type RawScanPayload = {
  requestId?: string;
  status?: "completed" | "error" | "pending" | string;
  source?: ScanAnalysisSession["source"];
  language?: string;
  confidence?: number;
  extractedData?: Record<string, unknown>;
  fields?: Record<string, unknown>;
  plainLanguageSummary?: string;
  urgency?: "LOW" | "MODERATE" | "HIGH";
  recommendations?: string[];
  warnings?: string[];
  timestamp?: string;
  error?: string;
  analysis?: ScanAnalysisSession["analysis"];
};

export function normalizeScanAnalysisSession(payload: RawScanPayload): ScanAnalysisSession {
  const extractedData = payload.extractedData || payload.fields || {};
  const analysis = payload.analysis;
  const plainLanguageSummary =
    payload.plainLanguageSummary || analysis?.summary || "";
  const urgency = payload.urgency || analysis?.urgency || "MODERATE";
  const recommendations = payload.recommendations || analysis?.recommendations || [];

  return {
    requestId: payload.requestId || `scan-${Date.now()}`,
    status:
      payload.status === "completed" || payload.status === "error" || payload.status === "pending"
        ? payload.status
        : "completed",
    source: payload.source || "raw",
    language: payload.language,
    confidence: payload.confidence,
    extractedData,
    plainLanguageSummary,
    urgency,
    recommendations,
    warnings: payload.warnings || [],
    timestamp: payload.timestamp || new Date().toISOString(),
    error: payload.error,
    analysis: analysis || (plainLanguageSummary || recommendations.length || urgency
      ? {
          summary: plainLanguageSummary,
          urgency,
          recommendations,
        }
      : undefined),
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