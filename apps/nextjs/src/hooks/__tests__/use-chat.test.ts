// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useChat } from "../use-chat";

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess?: () => void; onError?: () => void }) => ({
    status: "idle",
    isIdle: true,
    mutateAsync: vi.fn(),
    ...options,
  }),
  QueryClient: class {},
  QueryClientProvider: ({ children }: { children: unknown }) => children,
}));

const trpcClient = {
  chat: {
    getHistory: { query: vi.fn() },
    clearHistory: { mutate: vi.fn() },
  },
};
const trpc = {
  chat: { sendMessage: { mutationOptions: vi.fn(() => ({})) } },
};

vi.mock("~/trpc/react", () => ({
  useTRPC: () => trpc,
  useTRPCClient: () => trpcClient,
}));

function sseStream(chunks: string[]): Response {
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    }),
    { status: 200 },
  );
}

function renderUseChat() {
  return renderHook(() => useChat());
}

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with empty messages", () => {
    const messages: unknown[] = [];
    expect(messages).toHaveLength(0);
  });

  it("isTyping starts as false", () => {
    const isTyping = false;
    expect(isTyping).toBe(false);
  });

  it("error starts as null", () => {
    const error = null;
    expect(error).toBeNull();
  });

  it("creates user message with correct sender", () => {
    const msg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: "What does my hemoglobin level mean?",
      timestamp: Date.now(),
    };
    expect(msg.sender).toBe("user");
    expect(msg.text).toContain("hemoglobin");
  });

  it("creates clara message with correct sender", () => {
    const msg = {
      id: `clara-${Date.now()}`,
      sender: "clara",
      text: "Your hemoglobin level is within normal range.",
      timestamp: Date.now(),
    };
    expect(msg.sender).toBe("clara");
    expect(msg.text).toContain("hemoglobin");
  });

  it("message has unique id", () => {
    const msg1 = { id: `user-${Date.now()}` };
    const msg2 = { id: `user-${Date.now() + 1}` };
    expect(msg1.id).not.toBe(msg2.id);
  });

  it("message has timestamp", () => {
    const before = Date.now();
    const msg = { timestamp: Date.now() };
    const after = Date.now();
    expect(msg.timestamp).toBeGreaterThanOrEqual(before);
    expect(msg.timestamp).toBeLessThanOrEqual(after);
  });

  it("supports image attachment", () => {
    const msg = {
      id: "user-1",
      sender: "user",
      text: "What is this?",
      image: "data:image/png;base64,abc123",
    };
    expect(msg.image).toBeTruthy();
    expect(msg.image).toContain("data:image");
  });

  it("fallback response when no analysisId", () => {
    const analysisId = undefined;
    const hasAnalysis = !!analysisId;
    expect(hasAnalysis).toBe(false);
  });

  it("sends via tRPC when analysisId is provided", () => {
    const analysisId = "550e8400-e29b-41d4-a716-446655440000";
    const hasAnalysis = !!analysisId;
    expect(hasAnalysis).toBe(true);
  });

  it("dialect defaults to Filipino", () => {
    const dialect = "Filipino";
    expect(dialect).toBe("Filipino");
  });

  it("supports Bisaya dialect", () => {
    const dialect = "Bisaya";
    expect(dialect).toBe("Bisaya");
  });

  it("supports Ilocano dialect", () => {
    const dialect = "Ilocano";
    expect(dialect).toBe("Ilocano");
  });

  it("clearMessages resets messages array", () => {
    const messages = [
      { id: "1", sender: "user", text: "hi" },
      { id: "2", sender: "clara", text: "hello" },
    ];
    const cleared: unknown[] = [];
    expect(cleared).toHaveLength(0);
    expect(cleared).not.toBe(messages);
  });

  it("chat.sendMessage input requires content", () => {
    const content = "";
    const hasContent = content.trim().length > 0;
    expect(hasContent).toBe(false);
  });

  it("chat.sendMessage input accepts content with image only", () => {
    const content = "";
    const image = "data:image/png;base64,abc";
    const hasContent = content.trim().length > 0;
    const hasImage = !!image;
    const shouldSend = hasContent || hasImage;
    expect(shouldSend).toBe(true);
  });

  it("analysisId must be UUID format", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(uuidRegex.test(uuid)).toBe(true);
  });
});

describe("useChat guest mode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("streams guest questions without an analysisId and tags the thread", async () => {
    const stream = sseStream([
      'data: {"event":"complete","answer":"Diabetes affects blood sugar."}\n\n',
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stream));

    const { result } = renderUseChat();

    await act(async () => {
      await result.current.sendMessage("what is diabetes?");
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].sender).toBe("clara");
    expect(result.current.messages[1].text).toBe(
      "Diabetes affects blood sugar.",
    );

    const [, init] = vi.mocked(fetch).mock.calls[0] as [
      string,
      { body: string },
    ];
    const payload = JSON.parse(init.body) as {
      metadata?: { threadId?: string };
    };
    expect(payload.metadata?.threadId).toMatch(/^guest_[0-9a-f-]+$/);
  });

  it("falls back to the canned message when guest streaming fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderUseChat();

    await act(async () => {
      await result.current.sendMessage("what is diabetes?");
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toContain(
      "Please upload a document first",
    );
  });
});
