import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { createTRPCContext } from "../../trpc";
import { appRouter } from "../../root";

type TrpcContext = Awaited<ReturnType<typeof createTRPCContext>>;

const createDbStub = (options?: { severity?: "LOW" | "MODERATE" | "HIGH" }) => {
  const analysisRows = [
    {
      id: "analysis-1",
      userId: "user-1",
      extractedFields: {
        Hemoglobin: "13.2 g/dL",
        WBC: "7.5 K/uL",
      },
      flaggedValues:
        options?.severity === "HIGH"
          ? [{ name: "WBC", value: "14.2 K/uL" }]
          : options?.severity === "MODERATE"
            ? [{ name: "WBC", value: "11.0 K/uL" }]
            : [],
      tanqmoCard:
        options?.severity === "HIGH"
          ? {
              severity: "HIGH",
              disclaimer:
                "⚠️ Ang ilang resulta ay hindi normal. Mag-book ng appointment sa doktor sa lalong madaling panahon.",
              bookingCta: "📞 Mag-book ng appointment sa doktor ngayon",
            }
          : undefined,
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
    assert.deepEqual(result.suggestedActions, ["continueChat"]);
  });

  it("adds booking guidance for high severity analyses", async () => {
    const caller = createCaller({ db: createDbStub({ severity: "HIGH" }) });

    const result = await caller.chat.sendMessage({
      analysisId: "550e8400-e29b-41d4-a716-446655440000",
      content: "Dapat ba akong mag-alala?",
      dialect: "Filipino",
    });

    assert.equal(result.safety.severity, "HIGH");
    assert.equal(result.suggestedActions[0], "bookAppointment");
    assert.match(
      result.assistantMessage.content,
      /Mag-book ng appointment sa doktor ngayon/,
    );
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
