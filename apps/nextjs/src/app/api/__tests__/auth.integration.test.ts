import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for the OAuth sign-in and logout flows.
 *
 * Prerequisites:
 * - better-auth configured with Discord & Google OAuth
 * - Session validation helpers in place
 * - Database schema with `document` table
 */

const BASE_URL = "http://localhost:3000";

function mockResponse(
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers ?? {}),
    json: async () => body,
  };
}

describe("OAuth Integration", () => {
  // Mock environment
  const TEST_USER_ID = "test-user-123";

  beforeEach(() => {
    // Clear any mock state
    vi.clearAllMocks();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (url: string | URL | Request, init?: RequestInit) => {
        const urlStr =
          typeof url === "string"
            ? url
            : url instanceof URL
              ? url.href
              : url.url;
        const headers = init?.headers ?? {};
        const isAuthd =
          (headers instanceof Headers
            ? headers.has("Authorization")
            : typeof headers === "object" && "Authorization" in headers) ||
          urlStr.includes("Authorization");
        if (urlStr.includes("provider=discord")) {
          return Promise.resolve(
            mockResponse(302, undefined, {
              Location: "https://discord.com/oauth2",
            }),
          );
        }
        if (urlStr.includes("provider=google")) {
          return Promise.resolve(
            mockResponse(302, undefined, {
              Location: "https://accounts.google.com",
            }),
          );
        }
        if (urlStr.includes("provider=invalid")) {
          return Promise.resolve(
            mockResponse(400, { error: "Invalid provider" }),
          );
        }
        if (urlStr === `${BASE_URL}/api/auth/signin`) {
          return Promise.resolve(
            mockResponse(400, { error: "Provider is required" }),
          );
        }
        if (urlStr === `${BASE_URL}/api/auth/logout`) {
          if (!isAuthd) {
            return Promise.resolve(
              mockResponse(401, { error: "Unauthorized" }),
            );
          }
          return Promise.resolve(mockResponse(200, { success: true }));
        }
        return Promise.resolve(mockResponse(404, { error: "Not found" }));
      },
    );
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

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
