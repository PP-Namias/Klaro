import { describe, expect, it, vi } from "vitest";

import type { TRPCContext } from "../../trpc";
import { requireAuth } from "../auth";

vi.mock("@trpc/server", () => ({
  TRPCError: class TRPCError extends Error {
    constructor(opts: { code: string; message: string }) {
      super(opts.message);
      this.name = "TRPCError";
      (this as Record<string, unknown>).code = opts.code;
    }
  },
}));

const makeCtx = (overrides: Partial<TRPCContext> = {}): TRPCContext =>
  ({
    session: {
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      session: {
        id: "sess-1",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        token: "test-token",
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
        userId: "user-1",
      },
    },
    authApi: null as never,
    db: null as never,
    traceId: "trace-1",
    language: "en",
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    ...overrides,
  }) as unknown as TRPCContext;

describe("requireAuth", () => {
  it("returns user info when authenticated", () => {
    const result = requireAuth(makeCtx());
    expect(result.user.id).toBe("user-1");
    expect(result.ipAddress).toBe("127.0.0.1");
    expect(result.userAgent).toBe("vitest");
  });

  it("throws when no session exists", () => {
    expect(() => requireAuth(makeCtx({ session: null as never }))).toThrow(
      "You must be authenticated",
    );
  });

  it("throws when no user in session", () => {
    expect(() =>
      requireAuth(makeCtx({ session: { user: null, session: null } as never })),
    ).toThrow("You must be authenticated");
  });

  it("throws when session is expired", () => {
    const expiredCtx = makeCtx({
      session: {
        user: { id: "user-1", name: "Test", email: "test@test.com" },
        session: {
          id: "sess-expired",
          expiresAt: new Date(Date.now() - 3600_000).toISOString(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
          userId: "user-1",
        },
      },
    });
    expect(() => requireAuth(expiredCtx)).toThrow("Session has expired");
  });

  it("returns null ip/ua when not available", () => {
    const result = requireAuth(
      makeCtx({ ipAddress: null as never, userAgent: null as never }),
    );
    expect(result.ipAddress).toBeNull();
    expect(result.userAgent).toBeNull();
  });
});
