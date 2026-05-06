import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  documentSchema,
  uploadDocumentInputSchema,
  uploadDocumentResponseSchema,
  uploadDocumentSchema,
  uploadResponseSchema,
} from "@klaro/validators";

describe("document upload endpoints", () => {
  describe("upload input validation", () => {
    it("accepts valid document upload input", () => {
      const input = {
        fileName: "lab_result.pdf",
        mimeType: "application/pdf",
        fileSize: 1024 * 100, // 100KB
      };

      const result = uploadDocumentInputSchema.parse(input);
      assert.equal(result.fileName, "lab_result.pdf");
      assert.equal(result.mimeType, "application/pdf");
      assert.equal(result.fileSize, 1024 * 100);
    });

    it("accepts image MIME types", () => {
      const input = {
        fileName: "scan.png",
        mimeType: "image/png",
        fileSize: 512 * 1024, // 512KB
      };

      const result = uploadDocumentInputSchema.parse(input);
      assert.equal(result.mimeType, "image/png");
    });

    it("rejects file size exceeding 50MB", () => {
      const input = {
        fileName: "huge_file.pdf",
        mimeType: "application/pdf",
        fileSize: 51 * 1024 * 1024, // 51MB
      };

      assert.throws(() => uploadDocumentInputSchema.parse(input), Error);
    });

    it("rejects invalid MIME type format", () => {
      const input = {
        fileName: "file.pdf",
        mimeType: "invalid-mime",
        fileSize: 1024,
      };

      assert.throws(() => uploadDocumentInputSchema.parse(input), Error);
    });

    it("rejects empty fileName", () => {
      const input = {
        fileName: "",
        mimeType: "application/pdf",
        fileSize: 1024,
      };

      assert.throws(() => uploadDocumentInputSchema.parse(input), Error);
    });

    it("rejects fileName exceeding 255 characters", () => {
      const input = {
        fileName: "a".repeat(256),
        mimeType: "application/pdf",
        fileSize: 1024,
      };

      assert.throws(() => uploadDocumentInputSchema.parse(input), Error);
    });

    it("rejects zero or negative file size", () => {
      const input = {
        fileName: "file.pdf",
        mimeType: "application/pdf",
        fileSize: 0,
      };

      assert.throws(() => uploadDocumentInputSchema.parse(input), Error);
    });
  });

  describe("file upload schema validation", () => {
    it("accepts valid file upload with default dialect", () => {
      const file = new File(["sample"], "scan.jpg", { type: "image/jpeg" });
      const result = uploadDocumentSchema.parse({ file });

      assert.equal(result.file.name, "scan.jpg");
      assert.equal(result.dialect, "Filipino");
    });

    it("rejects unsupported file type", () => {
      const file = new File(["sample"], "scan.exe", {
        type: "application/x-msdownload",
      });

      assert.throws(() => uploadDocumentSchema.parse({ file }), Error);
    });

    it("rejects file size over 50MB", () => {
      const bigBuffer = new ArrayBuffer(51 * 1024 * 1024);
      const file = new File([bigBuffer], "big.pdf", {
        type: "application/pdf",
      });

      assert.throws(() => uploadDocumentSchema.parse({ file }), Error);
    });
  });

  describe("document response validation", () => {
    it("validates complete document object", () => {
      const doc = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user123",
        fileName: "lab_result.pdf",
        mimeType: "application/pdf",
        fileSize: 102400,
        storageUrl: "https://example.com/docs/lab_result.pdf",
        status: "analyzed" as const,
        ocrText: "Lab Results for John Doe...",
        confidence: 0.95,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = documentSchema.parse(doc);
      assert.equal(result.status, "analyzed");
      assert.equal(result.confidence, 0.95);
    });

    it("accepts all valid status values", () => {
      const statuses = [
        "uploaded",
        "processing",
        "analyzed",
        "failed",
      ] as const;

      for (const status of statuses) {
        const doc = {
          id: "550e8400-e29b-41d4-a716-446655440000",
          userId: "user123",
          fileName: "file.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          storageUrl: null,
          status,
          ocrText: null,
          confidence: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const result = documentSchema.parse(doc);
        assert.equal(result.status, status);
      }
    });

    it("rejects invalid status value", () => {
      const doc = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user123",
        fileName: "file.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        storageUrl: null,
        status: "invalid",
        ocrText: null,
        confidence: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.throws(() => documentSchema.parse(doc), Error);
    });

    it("rejects confidence outside 0-100 range", () => {
      const doc = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user123",
        fileName: "file.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        storageUrl: null,
        status: "analyzed" as const,
        ocrText: null,
        confidence: 150, // invalid
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      assert.throws(() => documentSchema.parse(doc), Error);
    });
  });

  describe("upload response validation", () => {
    it("validates presigned URL response", () => {
      const response = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        uploadUrl: "https://upload.example.com/presigned/abc123",
        fileName: "scan.pdf",
        expiresIn: 3600,
      };

      const result = uploadResponseSchema.parse(response);
      assert.equal(result.documentId, "550e8400-e29b-41d4-a716-446655440000");
      assert.equal(result.expiresIn, 3600);
    });

    it("rejects invalid documentId UUID", () => {
      const response = {
        documentId: "not-a-uuid",
        uploadUrl: "https://upload.example.com/presigned/abc123",
        fileName: "scan.pdf",
        expiresIn: 3600,
      };

      assert.throws(() => uploadResponseSchema.parse(response), Error);
    });

    it("rejects invalid uploadUrl", () => {
      const response = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        uploadUrl: "not-a-url",
        fileName: "scan.pdf",
        expiresIn: 3600,
      };

      assert.throws(() => uploadResponseSchema.parse(response), Error);
    });

    it("rejects zero or negative expiresIn", () => {
      const response = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        uploadUrl: "https://upload.example.com/presigned/abc123",
        fileName: "scan.pdf",
        expiresIn: 0,
      };

      assert.throws(() => uploadResponseSchema.parse(response), Error);
    });
  });

  describe("scan upload response validation", () => {
    it("validates scan upload response", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analysisId: "4b2670d5-3b7f-4a7a-8f27-9e5b9f40d25a",
        status: "uploaded",
        message: "Document received. Processing will begin shortly.",
        fileName: "scan.pdf",
        fileSize: 1024,
      };

      const result = uploadDocumentResponseSchema.parse(response);
      assert.equal(result.status, "uploaded");
      assert.equal(result.fileName, "scan.pdf");
    });

    it("rejects invalid status", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analysisId: "4b2670d5-3b7f-4a7a-8f27-9e5b9f40d25a",
        status: "failed",
        message: "Nope",
        fileName: "scan.pdf",
        fileSize: 1024,
      };

      assert.throws(() => uploadDocumentResponseSchema.parse(response), Error);
    });
  });
});
