import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for OAuth flow and file upload with authentication
 *
 * Prerequisites:
 * - better-auth configured with Discord & Google OAuth
 * - Session validation helpers in place
 * - Database schema with `document` table
 */

describe("OAuth & Upload Integration", () => {
  // Mock environment
  const BASE_URL = "http://localhost:3000";
  const TEST_USER_ID = "test-user-123";
  const TEST_SESSION = {
    userId: TEST_USER_ID,
    email: "test@example.com",
    name: "Test User",
  };

  beforeEach(() => {
    // Clear any mock state
    vi.clearAllMocks();
  });

  describe("OAuth Sign-In Flow", () => {
    it("should redirect to Discord OAuth URL when provider=discord", async () => {
      const response = await fetch(
        `${BASE_URL}/api/auth/signin?provider=discord`,
        { redirect: "manual" },
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("discord.com");
    });

    it("should redirect to Google OAuth URL when provider=google", async () => {
      const response = await fetch(
        `${BASE_URL}/api/auth/signin?provider=google`,
        { redirect: "manual" },
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("Location");
      expect(location).toContain("accounts.google.com");
    });

    it("should return 400 for invalid provider", async () => {
      const response = await fetch(
        `${BASE_URL}/api/auth/signin?provider=invalid`,
        { method: "GET" },
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 when provider parameter missing", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "GET",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("File Upload with Authentication", () => {
    it("should reject upload without authentication (401)", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test content"], { type: "image/png" }),
        "test.png",
      );

      const response = await fetch(`${BASE_URL}/api/uploads/server`, {
        method: "POST",
        body: formData,
        // No Authorization header
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should accept upload with valid session and store userId from session", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["test content"], { type: "image/png" }),
        "test.png",
      );

      // Mock authenticated request with session cookie
      const response = await fetch(`${BASE_URL}/api/uploads/server`, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies
        headers: {
          // better-auth uses httpOnly cookie, but we simulate Authorization header
          Authorization: `Bearer ${TEST_USER_ID}`,
        },
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.userId).toBe(TEST_USER_ID); // Should come from session, not formData
      expect(data.fileName).toBe("test.png");
      expect(data.url).toBeDefined(); // Cloudinary URL
    });

    it("should return 413 for file too large (>50MB)", async () => {
      const largeBlob = new Blob(
        [new ArrayBuffer(51 * 1024 * 1024)], // 51 MB
        { type: "image/png" },
      );
      const formData = new FormData();
      formData.append("file", largeBlob, "large.png");

      const response = await fetch(`${BASE_URL}/api/uploads/server`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      expect(response.status).toBe(413);
    });

    it("should return 415 for unsupported file type", async () => {
      const formData = new FormData();
      formData.append(
        "file",
        new Blob(["fake executable"], { type: "application/x-msdownload" }),
        "malware.exe",
      );

      const response = await fetch(`${BASE_URL}/api/uploads/server`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      expect(response.status).toBe(415);
    });

    it("should return 400 when file is missing", async () => {
      const formData = new FormData();
      // No file appended

      const response = await fetch(`${BASE_URL}/api/uploads/server`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Document Ownership Validation", () => {
    it("should allow authenticated user to retrieve their own document", async () => {
      const docId = "doc-owned-by-user";

      const response = await fetch(`${BASE_URL}/api/uploads/${docId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${TEST_USER_ID}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.userId).toBe(TEST_USER_ID);
    });

    it("should return 403 when user tries to access document owned by another user", async () => {
      const docId = "doc-owned-by-someone-else";
      const otherUserId = "other-user-456";

      const response = await fetch(`${BASE_URL}/api/uploads/${docId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${otherUserId}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    it("should return 401 when accessing document without authentication", async () => {
      const docId = "doc-123";

      const response = await fetch(`${BASE_URL}/api/uploads/${docId}`, {
        method: "GET",
        // No credentials or Authorization header
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent document", async () => {
      const nonExistentId = "does-not-exist";

      const response = await fetch(`${BASE_URL}/api/uploads/${nonExistentId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${TEST_USER_ID}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Logout Endpoint", () => {
    it("should clear session on authenticated POST /api/auth/logout", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${TEST_USER_ID}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should return 401 for logout without authentication", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        // No credentials or Authorization header
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Cloudinary Signature Endpoint", () => {
    it("should return signed params when authenticated", async () => {
      const response = await fetch(`${BASE_URL}/api/uploads/sign`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${TEST_USER_ID}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.signature).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.cloudName).toBeDefined();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await fetch(`${BASE_URL}/api/uploads/sign`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });
  });

  afterEach(() => {
    // Cleanup
  });
});
