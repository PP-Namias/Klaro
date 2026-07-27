import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPreviewUrl,
  fileToBase64,
  formatBytes,
  getFileKind,
  getFileMetadata,
  validateFile,
  validateFiles,
} from "../file-validation";

function createFile(
  name: string,
  type: string,
  size: number,
  content?: string,
): File {
  const buffer = content ? new Blob([content]) : new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

function createPdfFile(name: string, pageCount: number): File {
  const pages = Array.from(
    { length: pageCount },
    (_, i) => `<</Type /Page /Parent 2 0 R>>`,
  ).join("\n");
  const body = `%PDF-1.4\n1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type /Pages /Kids [${pages}] /Count ${pageCount}>>\nendobj\n`;
  return new File([body], name, { type: "application/pdf" });
}

describe("validateFile", () => {
  it("accepts PNG files", async () => {
    const file = createFile("test.png", "image/png", 1024);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "image",
    });
  });

  it("accepts JPEG files", async () => {
    const file = createFile("test.jpg", "image/jpeg", 1024);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "image",
    });
  });

  it("accepts WebP files", async () => {
    const file = createFile("test.webp", "image/webp", 1024);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "image",
    });
  });

  it("accepts PDF files", async () => {
    const file = createPdfFile("report.pdf", 1);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "pdf",
    });
  });

  it("accepts TIFF files", async () => {
    const file = createFile("scan.tiff", "image/tiff", 1024);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "image",
    });
  });

  it("rejects EXE files", async () => {
    const file = createFile("malware.exe", "application/x-msdownload", 1024);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not supported");
  });

  it("rejects TXT files", async () => {
    const file = createFile("notes.txt", "text/plain", 1024);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not supported");
  });

  it("rejects files over 50MB", async () => {
    const file = createFile("huge.png", "image/png", 51 * 1024 * 1024);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("50 MB limit");
  });

  it("rejects empty files", async () => {
    const file = createFile("empty.png", "image/png", 0);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too small");
  });

  it("accepts files at exactly 100 bytes", async () => {
    const file = createFile("ok.png", "image/png", 100);
    await expect(validateFile(file)).resolves.toMatchObject({ valid: true });
  });

  it("accepts files at exactly 50MB", async () => {
    const file = createFile("max.png", "image/png", 50 * 1024 * 1024);
    await expect(validateFile(file)).resolves.toMatchObject({ valid: true });
  });

  it("rejects PDFs with more than 10 pages", async () => {
    const file = createPdfFile("long.pdf", 15);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("15 pages");
    expect(result.error).toContain("10 pages or fewer");
  });

  it("accepts PDFs with 10 pages", async () => {
    const file = createPdfFile("ok.pdf", 10);
    await expect(validateFile(file)).resolves.toMatchObject({
      valid: true,
      kind: "pdf",
    });
  });

  it("returns pageCount for PDFs", async () => {
    const file = createPdfFile("multi.pdf", 5);
    const result = await validateFile(file);
    expect(result.pageCount).toBe(5);
  });

  it("does not return pageCount for images", async () => {
    const file = createFile("pic.png", "image/png", 500);
    const result = await validateFile(file);
    expect(result.pageCount).toBeUndefined();
  });

  it("returns pdf kind for valid PDF", async () => {
    const file = createPdfFile("doc.pdf", 1);
    await expect(validateFile(file)).resolves.toMatchObject({ kind: "pdf" });
  });

  it("returns image kind for valid PNG", async () => {
    const file = createFile("pic.png", "image/png", 500);
    await expect(validateFile(file)).resolves.toMatchObject({ kind: "image" });
  });

  it("handles files with empty type", async () => {
    const file = createFile("unknown", "", 1024);
    const result = await validateFile(file);
    expect(result.valid).toBe(false);
  });
});

describe("validateFiles", () => {
  it("separates valid and invalid files", async () => {
    const valid = createFile("ok.png", "image/png", 1024);
    const invalid = createFile("bad.exe", "application/x-msdownload", 1024);

    const result = await validateFiles([valid, invalid]);
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.valid[0]).toBe(valid);
  });

  it("returns all valid when all pass", async () => {
    const f1 = createFile("a.png", "image/png", 1024);
    const f2 = createFile("b.jpg", "image/jpeg", 1024);

    const result = await validateFiles([f1, f2]);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(0);
  });

  it("returns all invalid when all fail", async () => {
    const f1 = createFile("a.exe", "application/x-msdownload", 1024);
    const f2 = createFile("b.txt", "text/plain", 1024);

    const result = await validateFiles([f1, f2]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(2);
  });

  it("returns empty arrays for empty input", async () => {
    const result = await validateFiles([]);
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

describe("getFileMetadata", () => {
  it("returns metadata for images", async () => {
    const file = createFile("photo.png", "image/png", 1024);
    const meta = await getFileMetadata(file);
    expect(meta.kind).toBe("image");
    expect(meta.pageCount).toBeUndefined();
    expect(meta.sizeFormatted).toBe("1.0 KB");
  });

  it("returns metadata for PDFs with page count", async () => {
    const file = createPdfFile("doc.pdf", 3);
    const meta = await getFileMetadata(file);
    expect(meta.kind).toBe("pdf");
    expect(meta.pageCount).toBe(3);
  });
});
