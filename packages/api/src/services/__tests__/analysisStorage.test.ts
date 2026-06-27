import { describe, expect, it, beforeEach } from "vitest";

import {
  saveAnalysis,
  getAnalysis,
  getAnalysisByDocumentId,
  getAllAnalyses,
  updateAnalysisStatus,
  deleteAnalysis,
  clearAllAnalyses,
  formatAnalysisForStorage,
  parseAnalysisFromStorage,
} from "../analysisStorage";
import type { SaveAnalysisInput } from "../analysisStorage";

describe("Analysis Storage", () => {
  beforeEach(() => {
    clearAllAnalyses();
  });

  const createTestInput = (): SaveAnalysisInput => ({
    documentId: "doc-123",
    extractedFields: { patientName: "John Doe", diagnosis: ["Hypertension"] },
    plainLanguageSummary: "Patient has hypertension",
    tanongMoCard: { severity: "high", questions: ["What is hypertension?"] },
    severity: "high",
  });

  describe("saveAnalysis", () => {
    it("creates analysis record", () => {
      const record = saveAnalysis(createTestInput());
      expect(record.id).toMatch(/^analysis-/);
      expect(record.documentId).toBe("doc-123");
      expect(record.status).toBe("completed");
    });

    it("stores extracted fields", () => {
      const record = saveAnalysis(createTestInput());
      expect(record.extractedFields.patientName).toBe("John Doe");
    });

    it("sets timestamps", () => {
      const record = saveAnalysis(createTestInput());
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getAnalysis", () => {
    it("returns analysis by ID", () => {
      const saved = saveAnalysis(createTestInput());
      const found = getAnalysis(saved.id);
      expect(found?.id).toBe(saved.id);
    });

    it("returns null for unknown ID", () => {
      expect(getAnalysis("nonexistent")).toBeNull();
    });
  });

  describe("getAnalysisByDocumentId", () => {
    it("returns analysis by document ID", () => {
      saveAnalysis(createTestInput());
      const found = getAnalysisByDocumentId("doc-123");
      expect(found?.documentId).toBe("doc-123");
    });

    it("returns null for unknown document ID", () => {
      expect(getAnalysisByDocumentId("nonexistent")).toBeNull();
    });
  });

  describe("getAllAnalyses", () => {
    it("returns all analyses", () => {
      saveAnalysis(createTestInput());
      saveAnalysis({ ...createTestInput(), documentId: "doc-456" });
      expect(getAllAnalyses()).toHaveLength(2);
    });
  });

  describe("updateAnalysisStatus", () => {
    it("updates status", () => {
      const saved = saveAnalysis(createTestInput());
      const updated = updateAnalysisStatus(saved.id, "archived");
      expect(updated?.status).toBe("archived");
    });

    it("returns null for unknown ID", () => {
      expect(updateAnalysisStatus("nonexistent", "archived")).toBeNull();
    });
  });

  describe("deleteAnalysis", () => {
    it("removes analysis", () => {
      const saved = saveAnalysis(createTestInput());
      expect(deleteAnalysis(saved.id)).toBe(true);
      expect(getAnalysis(saved.id)).toBeNull();
    });

    it("returns false for unknown ID", () => {
      expect(deleteAnalysis("nonexistent")).toBe(false);
    });
  });

  describe("formatAnalysisForStorage", () => {
    it("serializes record for storage", () => {
      const record = saveAnalysis(createTestInput());
      const formatted = formatAnalysisForStorage(record);

      expect(typeof formatted.extractedFields).toBe("string");
      expect(typeof formatted.tanongMoCard).toBe("string");
      expect(formatted.createdAt).toBeDefined();
    });
  });

  describe("parseAnalysisFromStorage", () => {
    it("deserializes stored record", () => {
      const record = saveAnalysis(createTestInput());
      const formatted = formatAnalysisForStorage(record);
      const parsed = parseAnalysisFromStorage(formatted);

      expect(parsed.id).toBe(record.id);
      expect(parsed.extractedFields.patientName).toBe("John Doe");
      expect(parsed.createdAt).toBeInstanceOf(Date);
    });
  });
});
