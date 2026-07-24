/**
 * Audit Router - HIPAA Compliance Reporting
 *
 * Provides endpoints for:
 * - Querying audit logs with filters
 * - Generating compliance reports
 * - Detecting suspicious activity
 * - Exporting audit data for external compliance tools
 */

import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod/v4";

import { db } from "@klaro/db/client";
import { phiAuditLog } from "@klaro/db/schema";

import type { AuditAction, AuditSeverity } from "../services/auditLogger";
import { protectedProcedure } from "../trpc";

// ============================================================================
// Validation Schemas
// ============================================================================

const auditQuerySchema = z.object({
  userId: z.string().optional(),
  documentId: z.string().uuid().optional(),
  action: z
    .enum([
      "document_upload",
      "document_view",
      "document_delete",
      "document_export",
      "ocr_processing",
      "llm_api_call",
      "phi_scrubbed",
      "chat_message",
      "analysis_generated",
      "analysis_viewed",
      "phi_detected_in_upload",
      "session_timeout",
      "auth_failure",
      "bulk_export",
    ])
    .optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

const complianceReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  includeDetails: z.boolean().default(false),
});

// ============================================================================
// Suspicious Activity Detection
// ============================================================================

export interface SuspiciousActivity {
  type: string;
  severity: AuditSeverity;
  userId?: string;
  ipAddress?: string;
  count: number;
  description: string;
  timestamp: Date;
}

/**
 * Detect suspicious patterns in audit logs
 */
async function detectSuspiciousActivity(
  startDate: Date,
  endDate: Date,
): Promise<SuspiciousActivity[]> {
  const activities: SuspiciousActivity[] = [];

  // Query audit logs for the period
  const logs = await db
    .select()
    .from(phiAuditLog)
    .where(
      and(
        gte(phiAuditLog.timestamp, startDate),
        lte(phiAuditLog.timestamp, endDate),
      ),
    )
    .orderBy(desc(phiAuditLog.timestamp));

  // Group by user for pattern detection
  const userLogs = new Map<string, typeof logs>();
  const ipLogs = new Map<string, typeof logs>();

  for (const log of logs) {
    if (log.userId) {
      const userGroup = userLogs.get(log.userId) || [];
      userGroup.push(log);
      userLogs.set(log.userId, userGroup);
    }
    if (log.ipAddress) {
      const ipGroup = ipLogs.get(log.ipAddress) || [];
      ipGroup.push(log);
      ipLogs.set(log.ipAddress, ipGroup);
    }
  }

  // Detect: Multiple failed auth attempts
  for (const [userId, userLogsList] of userLogs) {
    const failedAuths = userLogsList.filter((l) => l.action === "auth_failure");
    if (failedAuths.length >= 5) {
      activities.push({
        type: "multiple_failed_auth",
        severity: "critical",
        userId,
        count: failedAuths.length,
        description: `User ${userId} had ${failedAuths.length} failed authentication attempts`,
        timestamp: new Date(),
      });
    }
  }

  // Detect: Excessive LLM API calls (potential abuse)
  for (const [userId, userLogsList] of userLogs) {
    const llmCalls = userLogsList.filter((l) => l.action === "llm_api_call");
    if (llmCalls.length >= 100) {
      activities.push({
        type: "excessive_api_usage",
        severity: "warning",
        userId,
        count: llmCalls.length,
        description: `User ${userId} made ${llmCalls.length} LLM API calls in the period`,
        timestamp: new Date(),
      });
    }
  }

  // Detect: PHI detected but not scrubbed
  const unscrubbedPhi = logs.filter(
    (l) =>
      l.action === "llm_api_call" &&
      l.details &&
      typeof l.details === "object" &&
      "phiScrubbed" in l.details &&
      (l.details as Record<string, unknown>).phiScrubbed === false,
  );

  if (unscrubbedPhi.length > 0) {
    activities.push({
      type: "unscrubbed_phi_api_call",
      severity: "critical",
      count: unscrubbedPhi.length,
      description: `${unscrubbedPhi.length} LLM API calls made without PHI scrubbing`,
      timestamp: new Date(),
    });
  }

  // Detect: Bulk document exports
  for (const [userId, userLogsList] of userLogs) {
    const exports = userLogsList.filter((l) => l.action === "document_export");
    if (exports.length >= 10) {
      activities.push({
        type: "bulk_export",
        severity: "warning",
        userId,
        count: exports.length,
        description: `User ${userId} exported ${exports.length} documents`,
        timestamp: new Date(),
      });
    }
  }

  // Detect: Unusual IP access patterns
  for (const [ip, ipLogsList] of ipLogs) {
    const uniqueUsers = new Set(
      ipLogsList.map((l) => l.userId).filter(Boolean),
    );
    if (uniqueUsers.size >= 3) {
      activities.push({
        type: "multi_user_ip_access",
        severity: "warning",
        ipAddress: ip,
        count: uniqueUsers.size,
        description: `IP ${ip} accessed by ${uniqueUsers.size} different users`,
        timestamp: new Date(),
      });
    }
  }

  return activities;
}

// ============================================================================
// Router
// ============================================================================

export const auditRouter = {
  /**
   * Query audit logs with filters
   */
  queryLogs: protectedProcedure
    .input(auditQuerySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const conditions = [];

      if (input.userId) {
        conditions.push(eq(phiAuditLog.userId, input.userId));
      }
      if (input.documentId) {
        conditions.push(eq(phiAuditLog.documentId, input.documentId));
      }
      if (input.action) {
        conditions.push(eq(phiAuditLog.action, input.action));
      }
      if (input.severity) {
        conditions.push(eq(phiAuditLog.severity, input.severity));
      }
      if (input.startDate) {
        conditions.push(gte(phiAuditLog.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(phiAuditLog.timestamp, new Date(input.endDate)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select()
        .from(phiAuditLog)
        .where(whereClause)
        .orderBy(desc(phiAuditLog.timestamp))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(phiAuditLog)
        .where(whereClause);

      return {
        logs,
        total: total[0]?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Generate HIPAA compliance report
   */
  generateComplianceReport: protectedProcedure
    .input(complianceReportSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Get all logs in period
      const logs = await db
        .select()
        .from(phiAuditLog)
        .where(
          and(
            gte(phiAuditLog.timestamp, startDate),
            lte(phiAuditLog.timestamp, endDate),
          ),
        )
        .orderBy(desc(phiAuditLog.timestamp));

      // Calculate statistics
      const stats = {
        totalEvents: logs.length,
        phiDetections: logs.filter(
          (l) =>
            l.phiTypesDetected &&
            Array.isArray(l.phiTypesDetected) &&
            l.phiTypesDetected.length > 0,
        ).length,
        externalApiCalls: logs.filter((l) => l.externalApiCalled).length,
        criticalEvents: logs.filter((l) => l.severity === "critical").length,
        warningEvents: logs.filter((l) => l.severity === "warning").length,
        uniqueUsers: new Set(logs.map((l) => l.userId).filter(Boolean)).size,
        uniqueDocuments: new Set(logs.map((l) => l.documentId).filter(Boolean))
          .size,
      };

      // Group by action type
      const byAction: Record<string, number> = {};
      for (const log of logs) {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
      }

      // Group by severity
      const bySeverity: Record<string, number> = {};
      for (const log of logs) {
        bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      }

      // Detect suspicious activity
      const suspiciousActivity = await detectSuspiciousActivity(
        startDate,
        endDate,
      );

      const report = {
        reportId: `compliance-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: stats,
        breakdown: {
          byAction,
          bySeverity,
        },
        suspiciousActivity,
        complianceStatus: {
          phiScrubbingEnabled: true,
          auditLoggingEnabled: true,
          retentionPolicy: "24 hours (configurable)",
          maxRetention: "7 days",
          logRetention: "6 years (HIPAA requirement)",
        },
        recommendations: generateRecommendations(stats, suspiciousActivity),
      };

      // Log the report generation
      console.log(
        JSON.stringify({
          type: "compliance_report_generated",
          reportId: report.reportId,
          generatedBy: ctx.session.user.id,
          period: report.period,
          timestamp: new Date().toISOString(),
        }),
      );

      return report;
    }),

  /**
   * Get suspicious activity alerts
   */
  detectSuspiciousActivity: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const suspiciousActivity = await detectSuspiciousActivity(
        startDate,
        endDate,
      );

      return {
        detected: suspiciousActivity.length > 0,
        activities: suspiciousActivity,
        checkedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get audit log statistics for dashboard
   */
  getStats: protectedProcedure
    .input(
      z.object({
        period: z.enum(["24h", "7d", "30d", "90d"]).default("24h"),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const now = new Date();
      const periodMs = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      };

      const startDate = new Date(now.getTime() - periodMs[input.period]);

      const logs = await db
        .select()
        .from(phiAuditLog)
        .where(gte(phiAuditLog.timestamp, startDate));

      return {
        period: input.period,
        totalEvents: logs.length,
        phiDetections: logs.filter(
          (l) =>
            l.phiTypesDetected &&
            Array.isArray(l.phiTypesDetected) &&
            l.phiTypesDetected.length > 0,
        ).length,
        externalApiCalls: logs.filter((l) => l.externalApiCalled).length,
        criticalEvents: logs.filter((l) => l.severity === "critical").length,
        uniqueUsers: new Set(logs.map((l) => l.userId).filter(Boolean)).size,
        topActions: getTopActions(logs),
        hourlyDistribution: getHourlyDistribution(logs),
      };
    }),
} satisfies TRPCRouterRecord;

// ============================================================================
// Helper Functions
// ============================================================================

function generateRecommendations(
  stats: {
    phiDetections: number;
    externalApiCalls: number;
    criticalEvents: number;
  },
  suspiciousActivity: SuspiciousActivity[],
): string[] {
  const recommendations: string[] = [];

  if (stats.criticalEvents > 0) {
    recommendations.push(
      `Review ${stats.criticalEvents} critical events immediately`,
    );
  }

  if (suspiciousActivity.length > 0) {
    recommendations.push(
      `Investigate ${suspiciousActivity.length} suspicious activity alerts`,
    );
  }

  if (stats.phiDetections > stats.externalApiCalls * 0.5) {
    recommendations.push(
      "High PHI detection rate - review document processing pipeline",
    );
  }

  if (stats.externalApiCalls > 1000) {
    recommendations.push(
      "Consider implementing API rate limiting to prevent abuse",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "No immediate action required - system operating normally",
    );
  }

  return recommendations;
}

function getTopActions(
  logs: Array<{ action: string }>,
): Array<{ action: string; count: number }> {
  const actionCounts: Record<string, number> = {};
  for (const log of logs) {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  }

  return Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getHourlyDistribution(
  logs: Array<{ timestamp: Date }>,
): Array<{ hour: number; count: number }> {
  const hourCounts: Record<number, number> = {};
  for (const log of logs) {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourCounts[i] || 0,
  }));
}
