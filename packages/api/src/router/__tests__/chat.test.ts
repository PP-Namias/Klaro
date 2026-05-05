import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appRouter } from "../../root";
import type { createTRPCContext } from "../../trpc";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

const createDbStub = () => {
  const analysisRows = [
    {
      id: "analysis-1",
      userId: "user-1",
      extractedFields: {
        Hemoglobin: "13.2 g/dL",
        WBC: "7.5 K/uL",
      },
      plainLanguageSummary: "Your results are mostly normal.",
    },
  ];

  const recentRows = [
    {
      id: "msg-1",
      analysisId: "analysis-1",
      userId: "user-1",
      role: "user",
      content: "Ano ibig sabihin ng WBC ko?",
      dialect: "Filipino",
      createdAt: new Date("2026-05-05T00:00:00Z"),
    },
  ];

  let selectCallCount = 0;

  const selectChain = {
    from: () => selectChain,
    where: () => {
      selectCallCount += 1;
      return selectCallCount === 1 ? analysisRows : selectChain;
    },
    orderBy: () => selectChain,
    limit: () => recentRows,
  };

  const insertChain = {
    values: () => ({
      returning: async () => [
        {
          id: "msg-2",
          analysisId: "analysis-1",
          userId: "user-1",
          role: "assistant",
          content: "Your results are mostly normal. Any new symptoms?",
          dialect: "Filipino",
          createdAt: new Date("2026-05-05T00:01:00Z"),
        },
      ],
    }),
  };

  return {
    select: () => selectChain,
    insert: () => insertChain,
  } as unknown as TrpcContext["db"];
};

const createAuthApiStub = () =>
  ({
    getSession: async () => null,
  }) as unknown as TrpcContext["authApi"];

const createSessionStub = (userId = "user-1") =>
  ({
    user: {
      id: userId,
      email: "user@klaro.local",
      name: "Test User",
    },
  }) as TrpcContext["session"];

const createCaller = (overrides?: Partial<TrpcContext>) => {
  const context = {
    authApi: createAuthApiStub(),
    session: createSessionStub(),
    db: createDbStub(),
    traceId: "test-trace",
    ...overrides,
  } as TrpcContext;

  return appRouter.createCaller(context);
};

describe("chat router", () => {
  it("sends a message and returns assistant follow-up", async () => {
    const caller = createCaller();
    const result = await caller.chat.sendMessage({
      analysisId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Ano ibig sabihin ng WBC ko?",
      dialect: "Filipino",
    });

    assert.equal(result.userMessage.role, "user");
    assert.equal(result.userMessage.content, "Ano ibig sabihin ng WBC ko?");
    assert.equal(result.assistantMessage.role, "assistant");
    assert.ok(result.assistantMessage.content.length > 0);
  });

  it("rejects unauthenticated chat access", async () => {
    const caller = createCaller({ session: null });

    await assert.rejects(
      caller.chat.sendMessage({
        analysisId: "550e8400-e29b-41d4-a716-446655440000",
        content: "Ano ibig sabihin ng WBC ko?",
        dialect: "Filipino",
      }),
      (error) => {
        const err = error as { code?: string };
        assert.equal(err.code, "UNAUTHORIZED");
        return true;
      },
    );
  });

  it("rejects invalid chat input", async () => {
    const caller = createCaller();

    await assert.rejects(
      caller.chat.sendMessage({
        analysisId: "550e8400-e29b-41d4-a716-446655440000",
        content: "",
        dialect: "Filipino",
      }),
      (error) => {
        const err = error as { code?: string };
        assert.equal(err.code, "BAD_REQUEST");
        return true;
      },
    );
  });
});
