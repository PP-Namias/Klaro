import { describe, expect, it } from "vitest";

import {
  getFileExtension,
  getMimeTypeFromFile,
  validateFile,
  validateFileName,
  validateFileSize,
  validateFileType,
} from "../fileValidation";

describe("validateFileType", () => {
  it("accepts PNG files", () => {
    expect(validateFileType({ type: "image/png", name: "test.png" })).toBe(
      true,
    );
  });

  it("accepts JPEG files", () => {
    expect(validateFileType({ type: "image/jpeg", name: "test.jpg" })).toBe(
      true,
    );
    expect(validateFileType({ type: "image/jpeg", name: "test.jpeg" })).toBe(
      true,
    );
  });

  it("accepts PDF files", () => {
    expect(
      validateFileType({ type: "application/pdf", name: "test.pdf" }),
    ).toBe(true);
  });

  it("accepts WebP files", () => {
    expect(validateFileType({ type: "image/webp", name: "test.webp" })).toBe(
      true,
    );
  });

  it("accepts TIFF files", () => {
    expect(validateFileType({ type: "image/tiff", name: "test.tiff" })).toBe(
      true,
    );
    expect(validateFileType({ type: "image/tiff", name: "test.tif" })).toBe(
      true,
    );
  });

  it("accepts BMP files", () => {
    expect(validateFileType({ type: "image/bmp", name: "test.bmp" })).toBe(
      true,
    );
  });

  it("accepts GIF files", () => {
    expect(validateFileType({ type: "image/gif", name: "test.gif" })).toBe(
      true,
    );
  });

  it("rejects EXE files", () => {
    expect(
      validateFileType({ type: "application/x-msdownload", name: "test.exe" }),
    ).toBe(false);
  });

  it("rejects BAT files", () => {
    expect(
      validateFileType({ type: "application/x-bat", name: "test.bat" }),
    ).toBe(false);
  });

  it("rejects unknown types", () => {
    expect(
      validateFileType({ type: "application/octet-stream", name: "test.xyz" }),
    ).toBe(false);
  });

  it("accepts by extension when mime type is generic", () => {
    expect(validateFileType({ type: "", name: "test.png" })).toBe(true);
    expect(
      validateFileType({ type: "application/octet-stream", name: "test.pdf" }),
    ).toBe(true);
  });
});

describe("validateFileSize", () => {
  it("accepts files under 50MB", () => {
    const result = validateFileSize(1024 * 1024); // 1MB
    expect(result.valid).toBe(true);
  });

  it("rejects files over 50MB", () => {
    const result = validateFileSize(60 * 1024 * 1024); // 60MB
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too large");
  });

  it("rejects files under 100 bytes", () => {
    const result = validateFileSize(50);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too small");
  });

  it("accepts custom max size", () => {
    const result = validateFileSize(5 * 1024 * 1024, 10 * 1024 * 1024); // 5MB with 10MB limit
    expect(result.valid).toBe(true);
  });
});

describe("validateFileName", () => {
  it("accepts valid file names", () => {
    const result = validateFileName("lab-result.pdf");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("lab-result.pdf");
  });

  it("sanitizes special characters", () => {
    const result = validateFileName("lab<result>:test.pdf");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("lab_result_test.pdf");
  });

  it("rejects empty file names", () => {
    const result = validateFileName("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot be empty");
  });

  it("rejects blocked extensions", () => {
    const result = validateFileName("malware.exe");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed");
  });

  it("collapses multiple underscores", () => {
    const result = validateFileName("lab___result.pdf");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("lab_result.pdf");
  });
});

describe("getFileExtension", () => {
  it("extracts extension from file name", () => {
    expect(getFileExtension("test.pdf")).toBe("pdf");
    expect(getFileExtension("test.PNG")).toBe("png");
    expect(getFileExtension("test.tar.gz")).toBe("gz");
  });

  it("returns empty string for no extension", () => {
    expect(getFileExtension("noextension")).toBe("");
  });
});

describe("getMimeTypeFromFile", () => {
  it("returns correct MIME type for known extensions", () => {
    expect(getMimeTypeFromFile("test.png")).toBe("image/png");
    expect(getMimeTypeFromFile("test.jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromFile("test.pdf")).toBe("application/pdf");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(getMimeTypeFromFile("test.xyz")).toBe("application/octet-stream");
  });
});

describe("validateFile", () => {
  it("returns valid for correct file", () => {
    const result = validateFile({
      type: "image/png",
      name: "test.png",
      size: 1024,
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.metadata.type).toBe("image/png");
    expect(result.metadata.size).toBe(1024);
    expect(result.metadata.extension).toBe("png");
  });

  it("returns errors for invalid file type", () => {
    const result = validateFile({
      type: "application/x-msdownload",
      name: "test.exe",
      size: 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns errors for oversized file", () => {
    const result = validateFile({
      type: "image/png",
      name: "test.png",
      size: 60 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("too large"))).toBe(true);
  });

  it("returns warnings for large files", () => {
    const result = validateFile({
      type: "image/png",
      name: "test.png",
      size: 15 * 1024 * 1024,
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("Large file"))).toBe(true);
  });
});
