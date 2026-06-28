import { describe, it, expect } from "vitest";
import {
  uploadDocumentInputSchema,
  documentStatusEnum,
  documentSchema,
  uploadResponseSchema,
  uploadDocumentResponseSchema,
} from "../documents";

describe("uploadDocumentInputSchema", () => {
  it("accepts valid fileName", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "lab-result.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty fileName", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fileName over 255 chars", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "a".repeat(256),
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid mimeType image/png", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.png",
      mimeType: "image/png",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid mimeType application/pdf", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid mimeType format", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.exe",
      mimeType: "application/exe",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("accepts fileSize under 50MB", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 1024 * 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects fileSize over 50MB", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 50 * 1024 * 1024 + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative fileSize", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer fileSize", () => {
    const result = uploadDocumentInputSchema.safeParse({
      fileName: "test.pdf",
      mimeType: "application/pdf",
      fileSize: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("documentStatusEnum", () => {
  it("accepts uploaded", () => {
    const result = documentStatusEnum.safeParse("uploaded");
    expect(result.success).toBe(true);
  });

  it("accepts processing", () => {
    const result = documentStatusEnum.safeParse("processing");
    expect(result.success).toBe(true);
  });

  it("accepts analyzed", () => {
    const result = documentStatusEnum.safeParse("analyzed");
    expect(result.success).toBe(true);
  });

  it("accepts failed", () => {
    const result = documentStatusEnum.safeParse("failed");
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = documentStatusEnum.safeParse("pending");
    expect(result.success).toBe(false);
  });
});

describe("documentSchema", () => {
  it("accepts valid document object", () => {
    const result = documentSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-123",
      fileName: "lab-result.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      storageUrl: "https://storage.example.com/file.pdf",
      status: "uploaded",
      ocrText: null,
      confidence: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable mimeType", () => {
    const result = documentSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-123",
      fileName: "lab-result.pdf",
      mimeType: null,
      fileSize: 1024,
      storageUrl: "https://storage.example.com/file.pdf",
      status: "uploaded",
      ocrText: null,
      confidence: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable storageUrl", () => {
    const result = documentSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-123",
      fileName: "lab-result.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
      storageUrl: null,
      status: "uploaded",
      ocrText: null,
      confidence: null,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("uploadResponseSchema", () => {
  it("accepts valid upload response", () => {
    const result = uploadResponseSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      uploadUrl: "https://storage.example.com/upload",
      fileName: "lab-result.pdf",
      expiresIn: 3600,
    });
    expect(result.success).toBe(true);
  });

  it("requires documentId as UUID", () => {
    const result = uploadResponseSchema.safeParse({
      documentId: "not-a-uuid",
      uploadUrl: "https://storage.example.com/upload",
      fileName: "lab-result.pdf",
      expiresIn: 3600,
    });
    expect(result.success).toBe(false);
  });

  it("requires uploadUrl as URL", () => {
    const result = uploadResponseSchema.safeParse({
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      uploadUrl: "not-a-url",
      fileName: "lab-result.pdf",
      expiresIn: 3600,
    });
    expect(result.success).toBe(false);
  });
});

describe("uploadDocumentResponseSchema", () => {
  it("accepts valid response", () => {
    const result = uploadDocumentResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      analysisId: "550e8400-e29b-41d4-a716-446655440001",
      status: "uploaded",
      message: "File uploaded successfully",
      fileName: "lab-result.pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("accepts processing status", () => {
    const result = uploadDocumentResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      analysisId: "550e8400-e29b-41d4-a716-446655440001",
      status: "processing",
      message: "Processing...",
      fileName: "lab-result.pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = uploadDocumentResponseSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      analysisId: "550e8400-e29b-41d4-a716-446655440001",
      status: "failed",
      message: "Error",
      fileName: "lab-result.pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });
});
