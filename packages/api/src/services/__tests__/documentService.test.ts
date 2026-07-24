import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocumentsByUserId,
  getDocumentStats,
  updateDocumentStatus,
} from "../documentService";

const createMockDb = () => {
  const mockReturn = vi.fn().mockResolvedValue([
    {
      id: "doc-1",
      userId: "user-1",
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      storageUrl: "https://cloudinary.com/test.pdf",
      status: "uploaded",
      ocrText: null,
      confidence: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          then: (cb: any) => cb(mockReturn()),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            then: (cb: any) =>
              cb(
                Promise.resolve([
                  {
                    id: "doc-1",
                    userId: "user-1",
                    fileName: "test.pdf",
                    mimeType: "application/pdf",
                    fileSize: 1024,
                    storageUrl: "https://cloudinary.com/test.pdf",
                    status: "uploaded",
                    ocrText: null,
                    confidence: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ]),
              ),
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([
                {
                  id: "doc-1",
                  userId: "user-1",
                  fileName: "test.pdf",
                  status: "uploaded",
                },
              ]),
            }),
          }),
        }),
        then: (cb: any) =>
          cb(
            Promise.resolve([
              {
                id: "doc-1",
                userId: "user-1",
                fileName: "test.pdf",
                status: "uploaded",
              },
            ]),
          ),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "doc-1",
              status: "processing",
              updatedAt: new Date(),
            },
          ]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    }),
  };
};

describe("Document Service", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("creates document with correct fields", async () => {
      const doc = await createDocument(mockDb as any, {
        userId: "user-1",
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        storageUrl: "https://cloudinary.com/test.pdf",
      });

      expect(doc).toBeDefined();
      expect(doc.userId).toBe("user-1");
      expect(doc.fileName).toBe("test.pdf");
      expect(doc.status).toBe("uploaded");
    });

    it("sets default values for optional fields", async () => {
      const doc = await createDocument(mockDb as any, {
        userId: "user-1",
        fileName: "test.pdf",
      });

      expect(doc).toBeDefined();
      expect(doc.userId).toBe("user-1");
    });
  });

  describe("getDocumentById", () => {
    it("returns document when found", async () => {
      const doc = await getDocumentById(mockDb as any, "doc-1");
      expect(doc).toBeDefined();
      expect(doc?.id).toBe("doc-1");
    });

    it("returns null when not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const doc = await getDocumentById(mockDb as any, "nonexistent");
      expect(doc).toBeNull();
    });
  });

  describe("getDocumentsByUserId", () => {
    it("returns user documents", async () => {
      const docs = await getDocumentsByUserId(mockDb as any, "user-1");
      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
    });

    it("supports pagination options", async () => {
      const docs = await getDocumentsByUserId(mockDb as any, "user-1", {
        limit: 5,
        offset: 0,
      });
      expect(docs).toBeDefined();
    });
  });

  describe("updateDocumentStatus", () => {
    it("updates status field", async () => {
      const updated = await updateDocumentStatus(
        mockDb as any,
        "doc-1",
        "processing",
      );
      expect(updated).toBeDefined();
      expect(updated?.status).toBe("processing");
    });

    it("updates OCR fields when provided", async () => {
      const updated = await updateDocumentStatus(
        mockDb as any,
        "doc-1",
        "analyzed",
        {
          ocrText: "extracted text",
          confidence: 0.95,
        },
      );
      expect(updated).toBeDefined();
    });
  });

  describe("deleteDocument", () => {
    it("removes document record", async () => {
      const result = await deleteDocument(mockDb as any, "doc-1");
      expect(result).toBe(true);
    });

    it("returns false when not found", async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 0 }),
      });

      const result = await deleteDocument(mockDb as any, "nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("getDocumentStats", () => {
    it("returns counts by status", async () => {
      const mockStatsDb = {
        select: vi
          .fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 5 }]),
            }),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  uploaded: 2,
                  processing: 1,
                  analyzed: 1,
                  failed: 1,
                },
              ]),
            }),
          }),
      };

      const stats = await getDocumentStats(mockStatsDb as any, "user-1");
      expect(stats).toBeDefined();
      expect(stats.total).toBe(5);
      expect(stats.uploaded).toBe(2);
      expect(stats.processing).toBe(1);
      expect(stats.analyzed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});
