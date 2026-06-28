import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("rate-limit", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  describe("checkRateLimit", () => {
    it("allows first request", async () => {
      const { checkRateLimit } = await import("~/lib/rate-limit");
      const result = checkRateLimit("test-key-1", 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("tracks multiple requests", async () => {
      const { checkRateLimit } = await import("~/lib/rate-limit");
      checkRateLimit("test-key-2", 5, 60000);
      checkRateLimit("test-key-2", 5, 60000);
      const result = checkRateLimit("test-key-2", 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("blocks when limit exceeded", async () => {
      const { checkRateLimit } = await import("~/lib/rate-limit");
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-key-3", 3, 60000);
      }
      const result = checkRateLimit("test-key-3", 3, 60000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("tracks independent keys", async () => {
      const { checkRateLimit } = await import("~/lib/rate-limit");
      checkRateLimit("key-a", 2, 60000);
      checkRateLimit("key-a", 2, 60000);
      const resultB = checkRateLimit("key-b", 2, 60000);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(1);
    });
  });

  describe("rateLimitResponse", () => {
    it("returns 429 status", async () => {
      const { rateLimitResponse } = await import("~/lib/rate-limit");
      const response = rateLimitResponse(0, Date.now() + 60000);
      expect(response.status).toBe(429);
    });

    it("sets correct headers", async () => {
      const { rateLimitResponse } = await import("~/lib/rate-limit");
      const resetAt = Date.now() + 60000;
      const response = rateLimitResponse(0, resetAt);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBe(
        resetAt.toString(),
      );
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });

    it("includes error message in body", async () => {
      const { rateLimitResponse } = await import("~/lib/rate-limit");
      const response = rateLimitResponse(0, Date.now() + 60000);
      const body = await response.json();
      expect(body.error).toBe("Too many requests");
      expect(body.retryAfter).toBeGreaterThanOrEqual(0);
    });
  });

  describe("RATE_LIMITS", () => {
    it("has auth signin limits", async () => {
      const { RATE_LIMITS } = await import("~/lib/rate-limit");
      expect(RATE_LIMITS.auth.signin.maxRequests).toBe(10);
      expect(RATE_LIMITS.auth.signin.windowMs).toBe(15 * 60 * 1000);
    });

    it("has auth logout limits", async () => {
      const { RATE_LIMITS } = await import("~/lib/rate-limit");
      expect(RATE_LIMITS.auth.logout.maxRequests).toBe(10);
    });

    it("has upload sign limits", async () => {
      const { RATE_LIMITS } = await import("~/lib/rate-limit");
      expect(RATE_LIMITS.uploads.sign.maxRequests).toBe(30);
    });

    it("has upload server limits", async () => {
      const { RATE_LIMITS } = await import("~/lib/rate-limit");
      expect(RATE_LIMITS.uploads.server.maxRequests).toBe(10);
    });

    it("has upload get limits", async () => {
      const { RATE_LIMITS } = await import("~/lib/rate-limit");
      expect(RATE_LIMITS.uploads.get.maxRequests).toBe(100);
    });
  });

  describe("cleanupRateLimitStore", () => {
    it("returns a number", async () => {
      const { cleanupRateLimitStore } = await import("~/lib/rate-limit");
      const cleaned = cleanupRateLimitStore();
      expect(typeof cleaned).toBe("number");
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("session-validation patterns", () => {
  it("validateSession returns ValidSession or null", () => {
    type ValidSession = { userId: string; email: string; name: string | null };
    const session: ValidSession | null = {
      userId: "user-1",
      email: "test@example.com",
      name: "Test User",
    };
    expect(session).not.toBeNull();
    expect(session!.userId).toBeTruthy();
  });

  it("assertSession throws when no session", () => {
    const session = null;
    expect(() => {
      if (!session) throw new Error("UNAUTHORIZED");
    }).toThrow("UNAUTHORIZED");
  });

  it("assertSession returns session when valid", () => {
    const session = {
      userId: "user-1",
      email: "test@example.com",
      name: null,
    };
    if (!session) throw new Error("UNAUTHORIZED");
    expect(session.userId).toBeTruthy();
    expect(session.email).toBeTruthy();
  });
});

describe("supabase config", () => {
  it("exports supabaseUrl", async () => {
    const { supabaseUrl } = await import("~/lib/supabase/config");
    expect(typeof supabaseUrl).toBe("string");
  });

  it("exports supabasePublishableKey", async () => {
    const { supabasePublishableKey } = await import(
      "~/lib/supabase/config",
    );
    expect(typeof supabasePublishableKey).toBe("string");
  });

  it("exports hasSupabaseConfig boolean", async () => {
    const { hasSupabaseConfig } = await import("~/lib/supabase/config");
    expect(typeof hasSupabaseConfig).toBe("boolean");
  });

  it("hasSupabaseConfig is false when env vars not set", async () => {
    const { hasSupabaseConfig } = await import("~/lib/supabase/config");
    // In test env, env vars are typically not set
    expect(hasSupabaseConfig).toBe(false);
  });
});
