import { describe, it, expect } from "node:test";

/**
 * Tests for /api/documents/scan endpoint
 * 
 * Covers:
 * - Successful file upload (JPEG, PNG, WebP, PDF)
 * - File type validation
 * - File size validation
 * - Auth validation
 * - Error responses
 */

describe("/api/documents/scan", () => {
  describe("GET /api/documents/scan", () => {
    it("should return endpoint metadata", async () => {
      const response = await fetch("/api/documents/scan");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("endpoint");
      expect(data).toHaveProperty("method");
      expect(data).toHaveProperty("description");
    });
  });

  describe("POST /api/documents/scan", () => {
    it("should return 401 when not authenticated", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "image/jpeg" });
      formData.append("file", blob, "test.jpg");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        // No auth header
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Unauthorized");
    });

    it("should return 400 when file field is missing", async () => {
      const formData = new FormData();
      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Missing 'file' field");
    });

    it("should return 400 for unsupported file types", async () => {
      const formData = new FormData();
      const blob = new Blob(["test"], { type: "application/json" });
      formData.append("file", blob, "test.json");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("File type not supported");
    });

    it("should return 413 for files exceeding 50MB", async () => {
      const formData = new FormData();
      const largeBlob = new Blob([new ArrayBuffer(51 * 1024 * 1024)], {
        type: "image/jpeg",
      });
      formData.append("file", largeBlob, "large.jpg");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toContain("exceeds 50MB");
    });

    it("should accept JPEG files", async () => {
      const formData = new FormData();
      const blob = new Blob(["fake jpeg data"], { type: "image/jpeg" });
      formData.append("file", blob, "scan.jpg");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("analysisId");
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("uploaded");
    });

    it("should accept PNG files", async () => {
      const formData = new FormData();
      const blob = new Blob(["fake png data"], { type: "image/png" });
      formData.append("file", blob, "scan.png");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id");
    });

    it("should accept PDF files", async () => {
      const formData = new FormData();
      const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
      formData.append("file", blob, "scan.pdf");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("id");
    });

    it("should include file metadata in response", async () => {
      const formData = new FormData();
      const blob = new Blob(["test data"], { type: "image/jpeg" });
      formData.append("file", blob, "my_scan.jpg");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.file).toHaveProperty("name");
      expect(data.file).toHaveProperty("size");
      expect(data.file).toHaveProperty("type");
      expect(data.file.name).toBe("my_scan.jpg");
      expect(data.file.type).toBe("image/jpeg");
    });

    it("should return 201 with proper status code on success", async () => {
      const formData = new FormData();
      const blob = new Blob(["valid scan data"], { type: "image/jpeg" });
      formData.append("file", blob, "document.jpg");

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token", // Mock
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain("Processing will begin shortly");
    });
  });
});

/**
 * Notes:
 * - These tests are integration-level; they assume the API route is deployed
 * - Mock auth tokens are used in tests; replace with actual auth flow in CI
 * - File uploads should be tested with real files in E2E suite
 * - To run: pnpm -F @klaro/nextjs test
 */
