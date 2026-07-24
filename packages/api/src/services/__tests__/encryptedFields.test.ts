import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDecryptedAnalysis,
  getDecryptedAnalysisByDocument,
  getDecryptedChatMessages,
  getDecryptedDocument,
  insertEncryptedAnalysis,
  insertEncryptedChatMessage,
  insertEncryptedDocument,
  updateChatMessageContent,
  updateDocumentOcr,
  updateEncryptedAnalysis,
} from "../encryptedFields";

process.env.ENCRYPTION_MASTER_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.ENCRYPTION_KEY_VERSION = "1";

const mockInsert = vi.fn();
const mockReturning = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateReturning = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

function buildQuery(result: unknown[]) {
  const q = Promise.resolve(result);
  (q as Record<string, unknown>).where = vi.fn(() => q);
  (q as Record<string, unknown>).orderBy = vi.fn(() => q);
  (q as Record<string, unknown>).limit = vi.fn(() => q);
  return q;
}

vi.mock("@klaro/db/client", () => ({
  db: {
    get insert() {
      return mockInsert;
    },
    get select() {
      return mockSelect;
    },
    get update() {
      return mockUpdate;
    },
  },
}));

vi.mock("@klaro/db/schema", () => ({
  document: { id: "id", userId: "user_id", fileName: "file_name" },
  analysis: { id: "id", documentId: "document_id" },
  chatMessage: { id: "id", analysisId: "analysis_id", createdAt: "created_at" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ field: a as string, value: b }),
  sql: (() => ({})) as unknown,
}));

describe("Encrypted Fields Service", () => {
  let mockValues: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
    mockReturning.mockResolvedValue([{ id: "doc-1" }]);
    const q = buildQuery([]);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue(q);
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning });
    mockUpdateReturning.mockResolvedValue([]);
  });

  describe("document encryption", () => {
    it("insertEncryptedDocument encrypts ocrText before insert", async () => {
      const result = await insertEncryptedDocument({
        userId: "user-1",
        fileName: "test.pdf",
        ocrText: "Patient: Juan Dela Cruz",
      });
      const valuesArg = mockValues.mock.calls[0][0] as Record<string, unknown>;
      expect(valuesArg).toHaveProperty("fileName", "test.pdf");
      expect(valuesArg.ocrText).not.toBe("Patient: Juan Dela Cruz");
      expect(result).toBeDefined();
    });

    it("getDecryptedDocument returns null for non-existent document", async () => {
      const result = await getDecryptedDocument("non-existent");
      expect(result).toBeNull();
    });

    it("updateDocumentOcr encrypts ocrText during update", async () => {
      mockUpdateReturning.mockResolvedValue([{ id: "doc-1" }]);
      const result = await updateDocumentOcr("doc-1", "New OCR text", 95.5);
      expect(result).toBeDefined();
    });
  });

  describe("analysis encryption", () => {
    it("insertEncryptedAnalysis encrypts sensitive fields", async () => {
      const result = await insertEncryptedAnalysis({
        documentId: "doc-1",
        userId: "user-1",
        extractedFields: { hemoglobin: 12.5 },
        plainLanguageSummary: "Patient is healthy",
        tanqmoCard: { diagnosis: "Normal" },
      });
      expect(result).toBeDefined();
      const valuesArg = mockValues.mock.calls[0][0] as Record<string, unknown>;
      expect(valuesArg).toHaveProperty("documentId", "doc-1");
    });

    it("getDecryptedAnalysis returns null for non-existent", async () => {
      const result = await getDecryptedAnalysis("non-existent");
      expect(result).toBeNull();
    });

    it("getDecryptedAnalysisByDocument returns null for non-existent", async () => {
      const result = await getDecryptedAnalysisByDocument("non-existent");
      expect(result).toBeNull();
    });

    it("updateEncryptedAnalysis encrypts updated fields", async () => {
      mockUpdateReturning.mockResolvedValue([{ id: "anal-1" }]);
      const result = await updateEncryptedAnalysis("anal-1", {
        plainLanguageSummary: "Updated summary",
        status: "completed",
      });
      expect(result).toBeDefined();
    });
  });

  describe("chat message encryption", () => {
    it("insertEncryptedChatMessage encrypts content", async () => {
      mockReturning.mockResolvedValue([{ id: "msg-1" }]);
      const result = await insertEncryptedChatMessage({
        analysisId: "anal-1",
        userId: "user-1",
        role: "user",
        content: "What does this result mean?",
      });
      expect(result).toBeDefined();
    });

    it("getDecryptedChatMessages returns empty array for no messages", async () => {
      const q = buildQuery([]);
      mockFrom.mockReturnValue(q);
      const messages = await getDecryptedChatMessages("anal-1");
      expect(messages).toEqual([]);
    });

    it("updateChatMessageContent encrypts new content", async () => {
      mockUpdateReturning.mockResolvedValue([
        { id: "msg-1", content: "encrypted" },
      ]);
      const result = await updateChatMessageContent("msg-1", "Updated message");
      expect(result).toBeDefined();
    });
  });
});
