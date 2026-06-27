import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  initUploadProgress,
  updateUploadProgress,
  getUploadProgress,
  completeUploadProgress,
  errorUploadProgress,
  removeUploadProgress,
  clearAllProgress,
} from "../uploadProgress";

describe("Upload Progress Tracking", () => {
  beforeEach(() => {
    clearAllProgress();
  });

  afterEach(() => {
    clearAllProgress();
  });

  describe("initUploadProgress", () => {
    it("creates new progress entry", () => {
      const progress = initUploadProgress("doc-1");
      expect(progress.documentId).toBe("doc-1");
      expect(progress.stage).toBe("idle");
      expect(progress.progress).toBe(0);
    });

    it("returns existing progress on re-init", () => {
      const p1 = initUploadProgress("doc-1");
      updateUploadProgress("doc-1", { stage: "uploading", progress: 25 });
      const p2 = initUploadProgress("doc-1");
      expect(p2.stage).toBe("uploading");
      expect(p2.progress).toBe(25);
    });
  });

  describe("updateUploadProgress", () => {
    it("updates stage", () => {
      initUploadProgress("doc-1");
      const updated = updateUploadProgress("doc-1", { stage: "ocr" });
      expect(updated.stage).toBe("ocr");
    });

    it("updates progress", () => {
      initUploadProgress("doc-1");
      const updated = updateUploadProgress("doc-1", { progress: 50 });
      expect(updated.progress).toBe(50);
    });

    it("updates message", () => {
      initUploadProgress("doc-1");
      const updated = updateUploadProgress("doc-1", {
        message: "Processing...",
      });
      expect(updated.message).toBe("Processing...");
    });

    it("updates error", () => {
      initUploadProgress("doc-1");
      const updated = updateUploadProgress("doc-1", {
        error: "File too large",
      });
      expect(updated.error).toBe("File too large");
    });

    it("creates progress if not initialized", () => {
      const updated = updateUploadProgress("doc-new", { stage: "uploading" });
      expect(updated.documentId).toBe("doc-new");
      expect(updated.stage).toBe("uploading");
    });

    it("updates updatedAt timestamp", async () => {
      initUploadProgress("doc-1");
      const before = new Date();
      await new Promise((r) => setTimeout(r, 10));
      const updated = updateUploadProgress("doc-1", { progress: 10 });
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe("getUploadProgress", () => {
    it("returns null for nonexistent doc", () => {
      const progress = getUploadProgress("nonexistent");
      expect(progress).toBeNull();
    });

    it("returns current progress", () => {
      initUploadProgress("doc-1");
      updateUploadProgress("doc-1", { stage: "processing", progress: 75 });
      const progress = getUploadProgress("doc-1");
      expect(progress?.stage).toBe("processing");
      expect(progress?.progress).toBe(75);
    });
  });

  describe("completeUploadProgress", () => {
    it("sets stage to complete and progress to 100", () => {
      initUploadProgress("doc-1");
      const completed = completeUploadProgress("doc-1");
      expect(completed?.stage).toBe("complete");
      expect(completed?.progress).toBe(100);
    });

    it("returns null for nonexistent doc", () => {
      const result = completeUploadProgress("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("errorUploadProgress", () => {
    it("sets stage to error with message", () => {
      initUploadProgress("doc-1");
      const errored = errorUploadProgress("doc-1", "Upload failed");
      expect(errored?.stage).toBe("error");
      expect(errored?.error).toBe("Upload failed");
    });

    it("returns null for nonexistent doc", () => {
      const result = errorUploadProgress("nonexistent", "fail");
      expect(result).toBeNull();
    });
  });

  describe("removeUploadProgress", () => {
    it("removes progress entry", () => {
      initUploadProgress("doc-1");
      const removed = removeUploadProgress("doc-1");
      expect(removed).toBe(true);
      expect(getUploadProgress("doc-1")).toBeNull();
    });

    it("returns false for nonexistent entry", () => {
      const removed = removeUploadProgress("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("clearAllProgress", () => {
    it("clears all entries", () => {
      initUploadProgress("doc-1");
      initUploadProgress("doc-2");
      clearAllProgress();
      expect(getUploadProgress("doc-1")).toBeNull();
      expect(getUploadProgress("doc-2")).toBeNull();
    });
  });
});
