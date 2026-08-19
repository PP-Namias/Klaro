import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { createTRPCContext } from "../../trpc";
import { appRouter } from "../../root";
import { chat as sidecarChat } from "../../services/aiSidecarClient";
import { callLLMAPI } from "../../services/llm";

vi.mock("../../services/aiSidecarClient", () => ({
  chat: vi.fn(),
}));

vi.mock("../../services/llm", () => ({
  callLLMAPI: vi.fn(),
}));

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
      flaggedValues: [],
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
          content: "sidecar answer",
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
    db: createDbStub(),
    traceId: "test-trace",
    ...overrides,
  } as TrpcContext;

  return appRouter.createCaller(context);
};

const sendMessage = (caller: ReturnType<typeof createCaller>) =>
  caller.chat.sendMessage({
    analysisId: "550e8400-e29b-41d4-a716-446655440000",
    content: "What does WBC mean?",
    dialect: "Filipino",
  });

describe("chat router — ai-sidecar wiring", () => {
  beforeEach(() => {
    vi.stubEnv("AI_SIDECAR_URL", "http://localhost:3002");
    vi.mocked(sidecarChat).mockReset();
    vi.mocked(callLLMAPI).mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("routes through the LangChain sidecar when AI_SIDECAR_URL is set", async () => {
    vi.mocked(sidecarChat).mockResolvedValue({
      answer: "Ang iyong WBC ay normal (7.5 K/uL).",
      followUpQuestions: ["May sintomas ka ba?"],
    });

    const caller = createCaller();
    const result = await sendMessage(caller);

    expect(sidecarChat).toHaveBeenCalledTimes(1);
    expect(sidecarChat).toHaveBeenCalledWith(
      "What does WBC mean?",
      expect.any(Array),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(callLLMAPI).not.toHaveBeenCalled();
    expect(result.assistantMessage.content).toContain(
      "Ang iyong WBC ay normal",
    );
    expect(result.suggestedActions).toEqual(["continueChat"]);
  });

  it("falls back to the direct LLM API when the sidecar is unreachable", async () => {
    vi.mocked(sidecarChat).mockRejectedValue(
      new Error("connect ECONNREFUSED 127.0.0.1:3002"),
    );
    vi.mocked(callLLMAPI).mockResolvedValue("Fallback LLM answer");

    const caller = createCaller();
    const result = await sendMessage(caller);

    expect(callLLMAPI).toHaveBeenCalledTimes(1);
    expect(result.assistantMessage.content).toContain("Fallback LLM answer");
  });

  it("skips the sidecar entirely when AI_SIDECAR_URL is not set", async () => {
    vi.stubEnv("AI_SIDECAR_URL", "");
    vi.mocked(callLLMAPI).mockResolvedValue("Direct answer");

    const caller = createCaller();
    const result = await sendMessage(caller);

    expect(sidecarChat).not.toHaveBeenCalled();
    expect(result.assistantMessage.content).toContain("Direct answer");
  });

  it("uses the analysis summary when both sidecar and LLM produce nothing", async () => {
    vi.mocked(sidecarChat).mockResolvedValue({
      answer: "",
      followUpQuestions: [],
    });
    vi.mocked(callLLMAPI).mockResolvedValue("");

    const caller = createCaller();
    const result = await sendMessage(caller);

    expect(result.assistantMessage.content).toContain(
      "Your results are mostly normal.",
    );
  });
});
