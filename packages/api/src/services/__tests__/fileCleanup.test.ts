import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@klaro/db/client", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
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

import { executeCleanup, getCleanupStats, cleanupDocument } from "../fileCleanup";

describe("File Cleanup Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });
});
