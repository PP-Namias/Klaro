import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signInInputSchema, sessionSchema, logoutResponseSchema } from "@klaro/validators";

describe("auth endpoints", () => {
  describe("session endpoint", () => {
    it("returns authenticated user session with valid data", () => {
      const mockSession = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        name: "John Doe",
        emailVerified: true,
      };

      const result = sessionSchema.parse(mockSession);
      assert.equal(result.id, mockSession.id);
      assert.equal(result.email, mockSession.email);
      assert.equal(result.name, mockSession.name);
      assert.equal(result.emailVerified, true);
    });

    it("validates email format", () => {
      const invalidSession = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "invalid-email",
        name: "John Doe",
        emailVerified: true,
      };

      assert.throws(() => sessionSchema.parse(invalidSession), Error);
    });

    it("validates uuid format for id", () => {
      const invalidSession = {
        id: "not-a-uuid",
        email: "user@example.com",
        name: "John Doe",
        emailVerified: true,
      };

      assert.throws(() => sessionSchema.parse(invalidSession), Error);
    });

    it("requires all fields", () => {
      const incompleteSession = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
      };

      assert.throws(() => sessionSchema.parse(incompleteSession), Error);
    });
  });

  describe("logout response", () => {
    it("validates successful logout response", () => {
      const logoutResponse = {
        success: true,
        message: "Session cleared successfully",
      };

      const result = logoutResponseSchema.parse(logoutResponse);
      assert.equal(result.success, true);
      assert.equal(result.message, "Session cleared successfully");
    });

    it("requires success field", () => {
      const invalidResponse = {
        message: "Session cleared",
      };

      assert.throws(() => logoutResponseSchema.parse(invalidResponse), Error);
    });
  });

  describe("sign in validation", () => {
    it("accepts discord provider", () => {
      const input = { provider: "discord" };
      const result = signInInputSchema.parse(input);
      assert.equal(result.provider, "discord");
    });

    it("accepts google provider", () => {
      const input = { provider: "google" };
      const result = signInInputSchema.parse(input);
      assert.equal(result.provider, "google");
    });

    it("rejects invalid provider", () => {
      const input = { provider: "github" };
      assert.throws(() => signInInputSchema.parse(input), Error);
    });
  });
});
