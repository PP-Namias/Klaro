import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock the database client
vi.mock("@klaro/db/client", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([]),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        limit: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// Mock the schema
vi.mock("@klaro/db/schema", () => ({
  phiAuditLog: {
    id: "id",
    timestamp: "timestamp",
    action: "action",
    userId: "user_id",
    sessionId: "session_id",
    documentId: "document_id",
    analysisId: "analysis_id",
    severity: "severity",
    details: "details",
    phiTypesDetected: "phi_types_detected",
    externalApiCalled: "external_api_called",
    ipAddress: "ip_address",
    userAgent: "user_agent",
    createdAt: "created_at",
  },
}));

import {
  logAuditEvent,
  logDocumentUpload,
  logLlmApiCall,
  logPhiScrubbing,
  logChatMessage,
  startAuditFlushTimer,
  stopAuditFlushTimer,
} from "../auditLogger";

describe("Audit Logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    stopAuditFlushTimer();
  });

  describe("logAuditEvent", () => {
    it("logs info event to console", async () => {
      await logAuditEvent({
        action: "document_upload",
        userId: "user-123",
        documentId: "doc-456",
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("logs warning event to console", async () => {
      await logAuditEvent({
        action: "phi_detected_in_upload",
        userId: "user-123",
        documentId: "doc-456",
        severity: "warning",
        phiTypesDetected: ["name", "ssn"],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("logs critical event to console", async () => {
      await logAuditEvent({
        action: "auth_failure",
        severity: "critical",
        ipAddress: "192.168.1.1",
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("logDocumentUpload", () => {
    it("logs upload without PHI detection", async () => {
      await logDocumentUpload({
        userId: "user-123",
        documentId: "doc-456",
        fileName: "lab_results.pdf",
        phiDetected: false,
        phiTypes: [],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("logs upload with PHI detection", async () => {
      await logDocumentUpload({
        userId: "user-123",
        documentId: "doc-456",
        fileName: "lab_results.pdf",
        phiDetected: true,
        phiTypes: ["name", "date_of_birth"],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("logLlmApiCall", () => {
    it("logs successful LLM call", async () => {
      await logLlmApiCall({
        userId: "user-123",
        documentId: "doc-456",
        analysisId: "analysis-789",
        phiScrubbed: true,
        phiCount: 3,
        externalProvider: "gemini",
        success: true,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("logs failed LLM call", async () => {
      await logLlmApiCall({
        userId: "user-123",
        phiScrubbed: true,
        phiCount: 0,
        externalProvider: "openai",
        success: false,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("warns when PHI not scrubbed", async () => {
      await logLlmApiCall({
        userId: "user-123",
        phiScrubbed: false,
        phiCount: 5,
        externalProvider: "gemini",
        success: true,
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("logPhiScrubbing", () => {
    it("logs PHI scrubbing event", async () => {
      await logPhiScrubbing({
        userId: "user-123",
        documentId: "doc-456",
        originalPhiCount: 5,
        scrubbedPhiCount: 5,
        phiTypes: ["name", "ssn", "mrn"],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("logChatMessage", () => {
    it("logs chat message without PHI", async () => {
      await logChatMessage({
        userId: "user-123",
        analysisId: "analysis-789",
        phiDetected: false,
        phiTypes: [],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("logs chat message with PHI", async () => {
      await logChatMessage({
        userId: "user-123",
        analysisId: "analysis-789",
        phiDetected: true,
        phiTypes: ["name"],
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("Timer Management", () => {
    it("starts flush timer", () => {
      startAuditFlushTimer();
      // No assertion needed, just ensure no error
    });

    it("stops flush timer", () => {
      startAuditFlushTimer();
      stopAuditFlushTimer();
      // No assertion needed, just ensure no error
    });

    it("can start timer multiple times safely", () => {
      startAuditFlushTimer();
      startAuditFlushTimer();
      stopAuditFlushTimer();
    });
  });
});
