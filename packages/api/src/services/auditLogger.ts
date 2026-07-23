/**
 * Audit Logger for PHI Access Events
 *
 * HIPAA requires logging of all access to PHI:
 * - Who accessed (user ID)
 * - What was accessed (document ID, analysis ID)
 * - When (timestamp)
 * - What action (upload, process, view, export, chat, LLM call)
 * - Result (success/failure)
 *
 * Logs are retained for 6 years per HIPAA requirements.
 */

import { db } from "@klaro/db/client";
import { phiAuditLog } from "@klaro/db/schema";

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
  | "document_upload"
  | "document_view"
  | "document_delete"
  | "document_export"
  | "ocr_processing"
  | "llm_api_call"
  | "phi_scrubbed"
  | "chat_message"
  | "analysis_generated"
  | "analysis_viewed"
  | "phi_detected_in_upload"
  | "session_timeout"
  | "auth_failure"
  | "bulk_export";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditEvent {
  action: AuditAction;
  userId?: string;
  sessionId?: string;
  documentId?: string;
  analysisId?: string;
  severity?: AuditSeverity;
  details?: Record<string, unknown>;
  phiTypesDetected?: string[];
  externalApiCalled?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  sessionId?: string;
  documentId?: string;
  analysisId?: string;
  severity: AuditSeverity;
  details?: Record<string, unknown>;
  phiTypesDetected?: string[];
  externalApiCalled: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// In-Memory Buffer (for high-throughput, async persistence)
// ============================================================================

const AUDIT_BUFFER: AuditEvent[] = [];
const FLUSH_INTERVAL_MS = 5000;
const MAX_BUFFER_SIZE = 100;

let flushTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the audit log flush timer
 */
export function startAuditFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushAuditBuffer().catch((err) => {
      console.error("[AuditLogger] Failed to flush audit buffer:", err);
    });
  }, FLUSH_INTERVAL_MS);
}

/**
 * Stop the audit log flush timer
 */
export function stopAuditFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/**
 * Flush buffered audit events to database
 */
async function flushAuditBuffer(): Promise<void> {
  if (AUDIT_BUFFER.length === 0) return;

  const events = [...AUDIT_BUFFER];
  AUDIT_BUFFER.length = 0;

  try {
    await db.insert(phiAuditLog).values(
      events.map((event) => ({
        action: event.action,
        userId: event.userId || null,
        sessionId: event.sessionId || null,
        documentId: event.documentId || null,
        analysisId: event.analysisId || null,
        severity: event.severity || "info",
        details: event.details || null,
        phiTypesDetected: event.phiTypesDetected || null,
        externalApiCalled: event.externalApiCalled || false,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
      })),
    );
  } catch (error) {
    console.error("[AuditLogger] Database write failed:", error);
    // Re-queue events on failure
    AUDIT_BUFFER.unshift(...events);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log a PHI access event
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const entry: AuditEvent = {
    ...event,
    severity: event.severity || "info",
  };

  // Console log for immediate visibility
  const logLevel =
    entry.severity === "critical"
      ? "error"
      : entry.severity === "warning"
        ? "warn"
        : "info";

  console[logLevel](
    JSON.stringify({
      type: "audit_log",
      action: entry.action,
      userId: entry.userId,
      documentId: entry.documentId,
      severity: entry.severity,
      phiDetected: (entry.phiTypesDetected?.length ?? 0) > 0,
      externalApi: entry.externalApiCalled,
      timestamp: new Date().toISOString(),
    }),
  );

  // Buffer for batch persistence
  AUDIT_BUFFER.push(entry);

  // Flush immediately for critical events
  if (entry.severity === "critical" || AUDIT_BUFFER.length >= MAX_BUFFER_SIZE) {
    await flushAuditBuffer();
  }
}

/**
 * Log document upload with PHI detection
 */
export async function logDocumentUpload(params: {
  userId?: string;
  documentId: string;
  fileName: string;
  phiDetected: boolean;
  phiTypes: string[];
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    action: params.phiDetected ? "phi_detected_in_upload" : "document_upload",
    userId: params.userId,
    documentId: params.documentId,
    severity: params.phiDetected ? "warning" : "info",
    phiTypesDetected: params.phiTypes,
    externalApiCalled: false,
    details: { fileName: params.fileName },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Log LLM API call (after PHI scrubbing)
 */
export async function logLlmApiCall(params: {
  userId?: string;
  documentId?: string;
  analysisId?: string;
  phiScrubbed: boolean;
  phiCount: number;
  externalProvider: string;
  success: boolean;
}): Promise<void> {
  await logAuditEvent({
    action: "llm_api_call",
    userId: params.userId,
    documentId: params.documentId,
    analysisId: params.analysisId,
    severity: params.phiScrubbed ? "info" : "warning",
    phiTypesDetected: params.phiScrubbed ? [] : ["potential_unscrubbed"],
    externalApiCalled: true,
    details: {
      provider: params.externalProvider,
      phiScrubbed: params.phiScrubbed,
      phiCount: params.phiCount,
      success: params.success,
    },
  });
}

/**
 * Log PHI scrubbing event
 */
export async function logPhiScrubbing(params: {
  userId?: string;
  documentId?: string;
  originalPhiCount: number;
  scrubbedPhiCount: number;
  phiTypes: string[];
}): Promise<void> {
  await logAuditEvent({
    action: "phi_scrubbed",
    userId: params.userId,
    documentId: params.documentId,
    severity: "info",
    phiTypesDetected: params.phiTypes,
    externalApiCalled: false,
    details: {
      originalPhiCount: params.originalPhiCount,
      scrubbedPhiCount: params.scrubbedPhiCount,
    },
  });
}

/**
 * Log chat message that may contain PHI
 */
export async function logChatMessage(params: {
  userId: string;
  analysisId: string;
  phiDetected: boolean;
  phiTypes: string[];
}): Promise<void> {
  await logAuditEvent({
    action: "chat_message",
    userId: params.userId,
    analysisId: params.analysisId,
    severity: params.phiDetected ? "warning" : "info",
    phiTypesDetected: params.phiTypes,
    externalApiCalled: false,
  });
}

/**
 * Query audit logs (for compliance reporting)
 */
export async function queryAuditLogs(params: {
  userId?: string;
  documentId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const conditions = [];

  if (params.userId) {
    conditions.push(/* sql */ `user_id = ${params.userId}`);
  }
  if (params.documentId) {
    conditions.push(/* sql */ `document_id = ${params.documentId}`);
  }
  if (params.action) {
    conditions.push(/* sql */ `action = ${params.action}`);
  }

  // Use Drizzle's query builder for type-safe queries
  const query = db.select().from(phiAuditLog);

  // For now, return recent logs (can be extended with Drizzle filters)
  const results = await db
    .select()
    .from(phiAuditLog)
    .limit(params.limit || 100)
    .offset(params.offset || 0);

  return results.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    action: row.action as AuditAction,
    userId: row.userId ?? undefined,
    sessionId: row.sessionId ?? undefined,
    documentId: row.documentId ?? undefined,
    analysisId: row.analysisId ?? undefined,
    severity: row.severity as AuditSeverity,
    details: row.details as Record<string, unknown> | undefined,
    phiTypesDetected: (row.phiTypesDetected as string[]) || undefined,
    externalApiCalled: row.externalApiCalled,
    ipAddress: row.ipAddress ?? undefined,
    userAgent: row.userAgent ?? undefined,
  }));
}

/**
 * Get audit summary for compliance reporting
 */
export async function getAuditSummary(params: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<{
  totalEvents: number;
  phiDetections: number;
  externalApiCalls: number;
  criticalEvents: number;
  eventsByAction: Record<string, number>;
}> {
  const allLogs = await db
    .select()
    .from(phiAuditLog)
    .limit(10000);

  let phiDetections = 0;
  let externalApiCalls = 0;
  let criticalEvents = 0;
  const eventsByAction: Record<string, number> = {};

  for (const log of allLogs) {
    eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;

    if (log.phiTypesDetected && Array.isArray(log.phiTypesDetected) && log.phiTypesDetected.length > 0) {
      phiDetections++;
    }
    if (log.externalApiCalled) {
      externalApiCalls++;
    }
    if (log.severity === "critical") {
      criticalEvents++;
    }
  }

  return {
    totalEvents: allLogs.length,
    phiDetections,
    externalApiCalls,
    criticalEvents,
    eventsByAction,
  };
}

// Auto-start flush timer on module load
startAuditFlushTimer();
