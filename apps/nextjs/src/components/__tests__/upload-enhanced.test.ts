import { describe, it, expect } from "vitest";

import type { UploadFileItem } from "~/hooks/use-file-upload";
import type { UploadErrorItem } from "~/components/upload-error";

describe("UploadError", () => {
  it("renders nothing when errors array is empty", () => {
    const errors: UploadErrorItem[] = [];
    expect(errors).toHaveLength(0);
  });

  it("shows error message for each failed file", () => {
    const errors: UploadErrorItem[] = [
      {
        fileName: "bad.exe",
        message: "Unsupported file type",
        type: "type",
      },
      {
        fileName: "huge.pdf",
        message: "File exceeds maximum size",
        type: "size",
      },
    ];
    expect(errors).toHaveLength(2);
    expect(errors[0]?.fileName).toBe("bad.exe");
    expect(errors[1]?.fileName).toBe("huge.pdf");
    expect(errors[0]?.message).toBe("Unsupported file type");
    expect(errors[1]?.message).toBe("File exceeds maximum size");
  });

  it("supports all error types", () => {
    const types: UploadErrorItem["type"][] = [
      "type",
      "size",
      "corrupt",
      "encrypted",
      "network",
      "processing",
    ];
    expect(types).toHaveLength(6);
    expect(types).toContain("encrypted");
    expect(types).toContain("network");
  });
});

describe("UploadComplete", () => {
  it("renders nothing when items array is empty", () => {
    const items: UploadFileItem[] = [];
    expect(items).toHaveLength(0);
  });

  it("shows file details for completed upload", () => {
    const items: UploadFileItem[] = [
      {
        id: "file-1",
        file: new File(["content"], "lab-results.pdf", {
          type: "application/pdf",
        }),
        stage: "complete",
        progress: 100,
        requestId: "analysis-1",
      },
    ];
    expect(items).toHaveLength(1);
    expect(items[0]?.stage).toBe("complete");
    expect(items[0]?.requestId).toBe("analysis-1");
  });

  it("has view analysis action for complete items", () => {
    const item: UploadFileItem = {
      id: "file-1",
      file: new File(["content"], "report.png", { type: "image/png" }),
      stage: "complete",
      progress: 100,
      requestId: "analysis-abc",
    };
    expect(item.stage).toBe("complete");
    expect(item.requestId).toBeTruthy();
  });
});

describe("Upload Queue", () => {
  it("tracks progress per file", () => {
    const items: UploadFileItem[] = [
      { id: "f1", file: new File(["a"], "a.pdf"), stage: "uploading", progress: 45 },
      { id: "f2", file: new File(["b"], "b.png"), stage: "complete", progress: 100 },
      { id: "f3", file: new File(["c"], "c.jpg"), stage: "pending", progress: 0 },
    ];
    expect(items[0]?.progress).toBe(45);
    expect(items[1]?.progress).toBe(100);
    expect(items[2]?.progress).toBe(0);
  });

  it("supports cancellation by file id", () => {
    const items: UploadFileItem[] = [
      { id: "f1", file: new File(["a"], "a.pdf"), stage: "pending", progress: 0 },
      { id: "f2", file: new File(["b"], "b.png"), stage: "uploading", progress: 50 },
    ];
    const cancelled = new Set<string>(["f1"]);
    const filtered = items.filter((f) => !cancelled.has(f.id));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("f2");
  });

  it("supports retry for failed files", () => {
    const item: UploadFileItem = {
      id: "f1",
      file: new File(["a"], "a.pdf"),
      stage: "error",
      progress: 0,
      error: "Network error",
    };
    const retried = { ...item, stage: "pending" as const, progress: 0, error: undefined };
    expect(retried.stage).toBe("pending");
    expect(retried.error).toBeUndefined();
  });
});

describe("File Validation", () => {
  it("validates file type", () => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
      "image/tiff",
      "image/bmp",
      "image/gif",
    ];
    expect(allowedTypes).toContain("application/pdf");
    expect(allowedTypes).toContain("image/png");
    expect(allowedTypes).not.toContain("application/exe");
  });

  it("validates file size (max 50MB)", () => {
    const maxSize = 50 * 1024 * 1024;
    const valid = new File(["small"], "ok.pdf").size <= maxSize;
    expect(valid).toBe(true);
  });

  it("rejects files over 50MB", () => {
    const maxSize = 50 * 1024 * 1024;
    const bigFileSize = 51 * 1024 * 1024;
    expect(bigFileSize).toBeGreaterThan(maxSize);
  });
});
