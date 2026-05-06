import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { createTRPCContext } from "../trpc";
import { appRouter } from "../root";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

interface DbStubRow {
  id: string;
  userId: string;
  fileName?: string;
}

const createDbStub = (rows: DbStubRow[]) => {
  const chain = {
    from: (..._args: unknown[]) => chain,
    where: (..._args: unknown[]) => chain,
    limit: (..._args: unknown[]) => chain,
    offset: (..._args: unknown[]) => chain,
    orderBy: (..._args: unknown[]) => rows,
  };

  return {
    select: (..._args: unknown[]) => chain,
  } as unknown as TrpcContext["db"];
};

const createAuthApiStub = () =>
  ({
    getSession: async () => null,
  }) as unknown as TrpcContext["authApi"];

const createSessionStub = () =>
  ({
    user: {
      id: "user-1",
      email: "user@klaro.local",
      name: "Test User",
    },
  }) as TrpcContext["session"];

const createCaller = (overrides?: Partial<TrpcContext>) => {
  const context = {
    authApi: createAuthApiStub(),
    session: createSessionStub(),
    db: createDbStub([{ id: "doc-1", userId: "user-1", fileName: "lab.pdf" }]),
    traceId: "test-trace",
    ...overrides,
  } as TrpcContext;

  return appRouter.createCaller(context);
};

describe("api utility endpoints", () => {
  it("returns health status", async () => {
    const caller = createCaller();
    const result = await caller.health();

    assert.equal(result.status, "ok");
    assert.equal(result.version, "1.0.0");
    assert.ok(result.timestamp);
  });

  it("returns version metadata", async () => {
    const caller = createCaller();
    const result = await caller.version();

    assert.equal(result.version, "1.0.0");
    assert.ok(result.timestamp);
  });

  it("returns current user data", async () => {
    const caller = createCaller();
    const result = await caller.me();

    assert.equal(result.id, "user-1");
    assert.equal(result.email, "user@klaro.local");
  });

  it("rejects unauthenticated access to me", async () => {
    const caller = createCaller({ session: null });

    await assert.rejects(caller.me(), (error) => {
      const err = error as { code?: string };
      assert.equal(err.code, "UNAUTHORIZED");
      return true;
    });
  });

  it("lists documents for authenticated user", async () => {
    const caller = createCaller();
    const result = await caller.documents.list({ limit: 10, offset: 0 });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "doc-1");
  });

  it("rejects unauthenticated access to documents.list", async () => {
    const caller = createCaller({ session: null });

    await assert.rejects(
      caller.documents.list({ limit: 10, offset: 0 }),
      (error) => {
        const err = error as { code?: string };
        assert.equal(err.code, "UNAUTHORIZED");
        return true;
      },
    );
  });
});
