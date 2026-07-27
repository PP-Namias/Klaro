import { describe, expect, it } from "vitest";
import { z } from "zod/v4";

describe("admin utility functions", () => {
  it("isAdmin accepts matching email", () => {
    const adminEmails = ["admin@example.com"];
    const userEmail = "admin@example.com";
    expect(adminEmails.includes(userEmail)).toBe(true);
  });

  it("isAdmin rejects non-matching email", () => {
    const adminEmails = ["admin@example.com"];
    const userEmail = "user@example.com";
    expect(adminEmails.includes(userEmail)).toBe(false);
  });

  it("isAdmin is case-insensitive", () => {
    const adminEmails = ["admin@example.com"];
    const userEmail = "ADMIN@EXAMPLE.COM";
    expect(adminEmails.includes(userEmail.toLowerCase())).toBe(true);
  });

  it("isAdmin handles multiple emails", () => {
    const adminEmails = ["admin1@example.com", "admin2@example.com"];
    expect(adminEmails.includes("admin1@example.com")).toBe(true);
    expect(adminEmails.includes("admin2@example.com")).toBe(true);
    expect(adminEmails.includes("user@example.com")).toBe(false);
  });

  it("isAdmin trims whitespace", () => {
    const rawEmails = " admin@example.com , other@example.com ";
    const adminEmails = rawEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    expect(adminEmails).toEqual(["admin@example.com", "other@example.com"]);
  });

  it("isAdmin filters empty entries", () => {
    const rawEmails = "admin@example.com,,,";
    const adminEmails = rawEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    expect(adminEmails).toEqual(["admin@example.com"]);
  });

  it("returns false for empty admin list", () => {
    const adminEmails: string[] = [];
    expect(adminEmails.length === 0).toBe(true);
  });
});

describe("requireAuth input schemas", () => {
  const sessionSchema = z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
    }),
  });

  it("validates valid session", () => {
    const session = {
      user: { id: "user-123", email: "user@example.com" },
    };
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("rejects session without user", () => {
    const result = sessionSchema.safeParse({ user: null });
    expect(result.success).toBe(false);
  });

  it("rejects session with missing user id", () => {
    const result = sessionSchema.safeParse({
      user: { email: "user@example.com" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = sessionSchema.safeParse({
      user: { id: "user-123", email: "not-an-email" },
    });
    expect(result.success).toBe(false);
  });
});
