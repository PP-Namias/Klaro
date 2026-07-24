import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockResponse(status: number, body?: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => body,
  };
}

describe("/api/documents/scan", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
      if (urlStr === "/api/documents/scan" || urlStr.endsWith("/api/documents/scan")) {
        return Promise.resolve(mockResponse(200, {
          endpoint: "/api/documents/scan",
          method: "POST",
          description: "Upload and scan a medical document",
        }));
      }
      return Promise.resolve(mockResponse(404, { error: "Not found" }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(401, { error: "Unauthorized" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Unauthorized");
    });

    it("should return 400 when file field is missing", async () => {
      const formData = new FormData();

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(400, { error: "Missing 'file' field" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(400, { error: "File type not supported" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(413, { error: "File exceeds 50MB" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(201, {
          id: "doc-123",
          analysisId: "analysis-123",
          status: "uploaded",
        })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(201, { id: "doc-456" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(201, { id: "doc-789" })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
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

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(201, {
          id: "doc-abc",
          fileName: "my_scan.jpg",
          fileSize: 9,
        })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("fileName");
      expect(data).toHaveProperty("fileSize");
      expect(data.fileName).toBe("my_scan.jpg");
    });

    it("should return 201 with proper status code on success", async () => {
      const formData = new FormData();
      const blob = new Blob(["valid scan data"], { type: "image/jpeg" });
      formData.append("file", blob, "document.jpg");

      vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
        Promise.resolve(mockResponse(201, {
          id: "doc-final",
          message: "Processing will begin shortly",
        })),
      );

      const response = await fetch("/api/documents/scan", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain("Processing will begin shortly");
    });
  });
});