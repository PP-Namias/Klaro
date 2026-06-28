import { describe, it, expect, vi, beforeEach } from "vitest";

describe("client initialization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws error when POSTGRES_URL is missing", async () => {
    const originalEnv = process.env.POSTGRES_URL;
    delete process.env.POSTGRES_URL;

    await expect(import("../client")).rejects.toThrow("Missing POSTGRES_URL");

    process.env.POSTGRES_URL = originalEnv;
  });

  it("exports db instance when POSTGRES_URL is set", async () => {
    const originalEnv = process.env.POSTGRES_URL;
    process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";

    const { db } = await import("../client");
    expect(db).toBeDefined();

    process.env.POSTGRES_URL = originalEnv;
  });
});
