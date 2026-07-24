import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cleanupDocument,
  executeCleanup,
  getCleanupStats,
} from "../fileCleanup";

// Mock dependencies
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn(() => Promise.resolve([]));
const mockLimit = vi.fn(function (this: unknown) {
  return this;
});
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

function buildQuery(result: unknown[]) {
  const query = Promise.resolve(result);
  (query as Record<string, unknown>).where = vi.fn(() => query);
  (query as Record<string, unknown>).limit = vi.fn(() => query);
  return query;
}

function setupDbMock(resolvedDocs: unknown[] = []) {
  const query = buildQuery(resolvedDocs);
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue(query);

  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue([]);
}

vi.mock("@klaro/db/client", () => ({
  db: {
    get select() {
      return mockSelect;
    },
    get update() {
      return mockUpdate;
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => args,
  eq: (a: unknown, b: unknown) => ({ field: a as string, value: b }),
  lt: (a: unknown, b: unknown) => ({ field: a as string, op: "lt", value: b }),
  inArray: (a: unknown, b: unknown) => ({
    field: a as string,
    op: "in",
    value: b,
  }),
  sql: (() => {}) as unknown,
}));

vi.mock("@klaro/db/schema", () => ({
  document: {
    id: "id",
    userId: "user_id",
    fileName: "file_name",
    storageUrl: "storage_url",
    status: "status",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

const makeDoc = (
  overrides: Partial<{
    id: string;
    userId: string;
    fileName: string;
    storageUrl: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) => ({
  id: "doc-1",
  userId: "user-123",
  fileName: "test-report.pdf",
  storageUrl: "https://res.cloudinary.com/demo/image/upload/v1/test-report",
  status: "analyzed",
  createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  ...overrides,
});

describe("File Cleanup Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDbMock([]);
  });

  describe("executeCleanup", () => {
    it("returns empty result when no documents need cleanup", async () => {
      const result = await executeCleanup({ dryRun: true });
      expect(result.totalFound).toBe(0);
      expect(result.deleted).toBe(0);
      expect(result.dryRun).toBe(true);
    });

    it("respects dry run mode", async () => {
      const result = await executeCleanup({ dryRun: true });
      expect(result.dryRun).toBe(true);
    });

    it("uses custom retention hours", async () => {
      const result = await executeCleanup({
        retentionHours: 48,
        dryRun: true,
      });
      expect(result.dryRun).toBe(true);
    });

    it("deletes files from Cloudinary and archives documents", async () => {
      const doc = makeDoc();
      setupDbMock([doc]);

      const { v2: cloudinary } = await import("cloudinary");
      const result = await executeCleanup({ dryRun: false });

      expect(result.totalFound).toBeGreaterThanOrEqual(1);
      expect(result.deletedFiles).toContain("test-report.pdf");
      expect(cloudinary.uploader.destroy).toHaveBeenCalled();
    });

    it("records failure when Cloudinary deletion fails", async () => {
      const doc = makeDoc();
      setupDbMock([doc]);

      const { v2: cloudinary } = await import("cloudinary");
      (
        cloudinary.uploader.destroy as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ result: "fail" });

      const result = await executeCleanup({ dryRun: false });
      expect(result.failed).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getCleanupStats", () => {
    it("returns cleanup statistics", async () => {
      const stats = await getCleanupStats();
      expect(stats).toHaveProperty("totalDocuments");
      expect(stats).toHaveProperty("documentsWithFiles");
      expect(stats).toHaveProperty("documentsPastRetention");
      expect(stats).toHaveProperty("oldestDocument");
    });
  });

  describe("cleanupDocument", () => {
    it("returns error for non-existent document", async () => {
      const result = await cleanupDocument("non-existent-id", "user-123");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("returns unauthorized error when userId does not match", async () => {
      const doc = makeDoc({ userId: "other-user" });
      setupDbMock([doc]);

      const result = await cleanupDocument("doc-1", "wrong-user");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });
});
