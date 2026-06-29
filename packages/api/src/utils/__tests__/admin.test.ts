import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isAdmin, requireAdmin } from "../admin";

describe("isAdmin", () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("returns false when session has no user", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await isAdmin({ db: null, session: null });
    expect(result).toBe(false);
  });

  it("returns false when user has no id", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await isAdmin({
      db: null,
      session: { user: { id: undefined, email: "test@example.com" } },
    });
    expect(result).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is empty", async () => {
    process.env.ADMIN_EMAILS = "";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(false);
  });

  it("returns false when ADMIN_EMAILS is not set", async () => {
    delete process.env.ADMIN_EMAILS;
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(false);
  });

  it("returns true when user email matches admin email", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(true);
  });

  it("returns true when email case differs", async () => {
    process.env.ADMIN_EMAILS = "ADMIN@EXAMPLE.COM";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(true);
  });

  it("returns false when email not in admin list", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "user@example.com" } },
    });
    expect(result).toBe(false);
  });

  it("handles multiple admin emails", async () => {
    process.env.ADMIN_EMAILS = "admin1@example.com,admin2@example.com";
    const result1 = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin1@example.com" } },
    });
    const result2 = await isAdmin({
      db: null,
      session: { user: { id: "user-2", email: "admin2@example.com" } },
    });
    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });

  it("trims whitespace from admin emails", async () => {
    process.env.ADMIN_EMAILS = " admin@example.com , other@example.com ";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(true);
  });

  it("returns false when user has no email", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await isAdmin({
      db: null,
      session: { user: { id: "user-1", email: undefined } },
    });
    expect(result).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("returns isAdmin result", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await requireAdmin({
      db: null,
      session: { user: { id: "user-1", email: "admin@example.com" } },
    });
    expect(result).toBe(true);
  });

  it("returns false for non-admin", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";
    const result = await requireAdmin({
      db: null,
      session: { user: { id: "user-1", email: "user@example.com" } },
    });
    expect(result).toBe(false);
  });
});
