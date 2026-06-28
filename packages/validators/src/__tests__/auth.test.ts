import { describe, it, expect } from "vitest";
import {
  signInInputSchema,
  sessionSchema,
  logoutResponseSchema,
} from "../auth";

describe("signInInputSchema", () => {
  it("accepts valid discord provider", () => {
    const result = signInInputSchema.safeParse({ provider: "discord" });
    expect(result.success).toBe(true);
  });

  it("accepts valid google provider", () => {
    const result = signInInputSchema.safeParse({ provider: "google" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider string", () => {
    const result = signInInputSchema.safeParse({ provider: "github" });
    expect(result.success).toBe(false);
  });

  it("rejects empty provider", () => {
    const result = signInInputSchema.safeParse({ provider: "" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric provider", () => {
    const result = signInInputSchema.safeParse({ provider: 123 });
    expect(result.success).toBe(false);
  });
});

describe("sessionSchema", () => {
  it("accepts valid session with UUID", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = sessionSchema.safeParse({
      id: "not-a-uuid",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid email", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@domain.com",
      name: "Test User",
      emailVerified: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
      name: "Test User",
      emailVerified: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires name field", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      emailVerified: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts emailVerified as boolean true", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts emailVerified as boolean false", () => {
    const result = sessionSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "test@example.com",
      name: "Test User",
      emailVerified: false,
    });
    expect(result.success).toBe(true);
  });
});

describe("logoutResponseSchema", () => {
  it("accepts success true", () => {
    const result = logoutResponseSchema.safeParse({
      success: true,
      message: "Logged out",
    });
    expect(result.success).toBe(true);
  });

  it("accepts success false", () => {
    const result = logoutResponseSchema.safeParse({
      success: false,
      message: "Error",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional message", () => {
    const result = logoutResponseSchema.safeParse({ success: true });
    expect(result.success).toBe(true);
  });
});
