import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  validateFile,
  validateFiles,
  formatBytes,
  fileToBase64,
  getFileKind,
  createPreviewUrl,
} from "../file-validation";

function createFile(name: string, type: string, size: number): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("validateFile", () => {
  it("accepts PNG files", () => {
    const file = createFile("test.png", "image/png", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("accepts JPEG files", () => {
    const file = createFile("test.jpg", "image/jpeg", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("accepts WebP files", () => {
    const file = createFile("test.webp", "image/webp", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("accepts PDF files", () => {
    const file = createFile("report.pdf", "application/pdf", 2048);
    expect(validateFile(file)).toEqual({ valid: true, kind: "pdf" });
  });

  it("accepts TIFF files", () => {
    const file = createFile("scan.tiff", "image/tiff", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("accepts BMP files", () => {
    const file = createFile("image.bmp", "image/bmp", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("accepts GIF files", () => {
    const file = createFile("anim.gif", "image/gif", 1024);
    expect(validateFile(file)).toEqual({ valid: true, kind: "image" });
  });

  it("rejects EXE files", () => {
    const file = createFile("malware.exe", "application/x-msdownload", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not supported");
  });

  it("rejects TXT files", () => {
    const file = createFile("notes.txt", "text/plain", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not supported");
  });

  it("rejects files over 50MB", () => {
    const file = createFile("huge.png", "image/png", 51 * 1024 * 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds 50 MB");
  });

  it("rejects empty files", () => {
    const file = createFile("empty.png", "image/png", 0);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too small");
  });

  it("rejects very small files under 100 bytes", () => {
    const file = createFile("tiny.png", "image/png", 50);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too small");
  });

  it("accepts files at exactly 100 bytes", () => {
    const file = createFile("ok.png", "image/png", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts files at exactly 50MB", () => {
    const file = createFile("max.png", "image/png", 50 * 1024 * 1024);
    expect(validateFile(file).valid).toBe(true);
  });

  it("returns pdf kind for valid PDF", () => {
    const file = createFile("doc.pdf", "application/pdf", 500);
    expect(validateFile(file).kind).toBe("pdf");
  });

  it("returns image kind for valid PNG", () => {
    const file = createFile("pic.png", "image/png", 500);
    expect(validateFile(file).kind).toBe("image");
  });

  it("handles files with empty type", () => {
    const file = createFile("unknown", "", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
  });
});

describe("validateFiles", () => {
  it("separates valid and invalid files", () => {
    const valid = createFile("ok.png", "image/png", 1024);
    const invalid = createFile("bad.exe", "application/x-msdownload", 1024);

    const result = validateFiles([valid, invalid]);
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.valid[0]).toBe(valid);
  });

  it("returns all valid when all pass", () => {
    const f1 = createFile("a.png", "image/png", 1024);
    const f2 = createFile("b.jpg", "image/jpeg", 1024);

    const result = validateFiles([f1, f2]);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(0);
  });

  it("returns all invalid when all fail", () => {
    const f1 = createFile("a.exe", "application/x-msdownload", 1024);
    const f2 = createFile("b.txt", "text/plain", 1024);

    const result = validateFiles([f1, f2]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(2);
  });

  it("returns empty arrays for empty input", () => {
    const result = validateFiles([]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });
});

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.00 MB");
    expect(formatBytes(2621440)).toBe("2.50 MB");
  });
});

describe("getFileKind", () => {
  it("returns pdf for PDF files", () => {
    const file = createFile("doc.pdf", "application/pdf", 100);
    expect(getFileKind(file)).toBe("pdf");
  });

  it("returns image for PNG files", () => {
    const file = createFile("pic.png", "image/png", 100);
    expect(getFileKind(file)).toBe("image");
  });

  it("returns image for JPEG files", () => {
    const file = createFile("pic.jpg", "image/jpeg", 100);
    expect(getFileKind(file)).toBe("image");
  });
});

describe("createPreviewUrl", () => {
  it("creates object URL for image files", () => {
    const file = createFile("pic.png", "image/png", 100);
    const url = createPreviewUrl(file);
    expect(url).toBeTruthy();
    expect(url).toContain("blob:");
  });

  it("returns undefined for PDF files", () => {
    const file = createFile("doc.pdf", "application/pdf", 100);
    expect(createPreviewUrl(file)).toBeUndefined();
  });

  it("returns undefined for non-image files", () => {
    const file = createFile("data.txt", "text/plain", 100);
    expect(createPreviewUrl(file)).toBeUndefined();
  });
});

describe("fileToBase64", () => {
  it("converts file to base64 string", async () => {
    const content = "hello world";
    const blob = new Blob([content]);
    const file = new File([blob], "test.txt", { type: "text/plain" });

    const result = await fileToBase64(file);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns base64 without data URL prefix", async () => {
    const blob = new Blob(["test"]);
    const file = new File([blob], "test.txt", { type: "text/plain" });

    const result = await fileToBase64(file);
    expect(result).not.toContain("data:");
    expect(result).not.toContain(",");
  });
});
