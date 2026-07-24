import { describe, expect, it, beforeEach } from "vitest";

import { checkRateLimit, resetRateLimitStore, getRateLimitStoreSize } from "../rateLimiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows first request", () => {
    const result = checkRateLimit("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks after exceeding limit", () => {
    const max = 3;
    for (let i = 0; i < max; i++) {
      const result = checkRateLimit("user-2", max, 60_000);
      if (i < max - 1) {
        expect(result.allowed).toBe(true);
      }
    }
    const blocked = checkRateLimit("user-2", max, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("allows requests from different keys independently", () => {
    for (let i = 0; i < 60; i++) {
      checkRateLimit("user-a");
    }
    const result = checkRateLimit("user-b");
    expect(result.allowed).toBe(true);
  });

  it("resets after window expires", async () => {
    const result = checkRateLimit("user-3", 1, 50);
    expect(result.allowed).toBe(true);

    const blocked = checkRateLimit("user-3", 1, 50);
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    const afterReset = checkRateLimit("user-3", 1, 50);
    expect(afterReset.allowed).toBe(true);
  });
});
