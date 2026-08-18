// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseSsePayload,
  streamChatResponse,
  useChatStream,
} from "../use-chat-stream";

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

describe("parseSsePayload", () => {
  it("parses token events", () => {
    expect(parseSsePayload('data: {"event":"token","token":"Hello"}')).toEqual({
      event: "token",
      token: "Hello",
    });
  });

  it("parses complete events", () => {
    expect(
      parseSsePayload(
        'data: {"event":"complete","answer":"Hi","followUpQuestions":["Q1?"]}',
      ),
    ).toEqual({
      event: "complete",
      answer: "Hi",
      followUpQuestions: ["Q1?"],
    });
  });

  it("parses error events", () => {
    expect(
      parseSsePayload('data: {"error":"Quota exceeded","code":429}'),
    ).toEqual({
      error: "Quota exceeded",
      code: 429,
    });
  });

  it("returns null for non-data lines and garbage JSON", () => {
    expect(parseSsePayload("event: token")).toBeNull();
    expect(parseSsePayload("data: not-json")).toBeNull();
    expect(parseSsePayload("")).toBeNull();
  });
});

describe("streamChatResponse", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accumulates tokens and resolves with the complete event", async () => {
    const stream = sseStream([
      'data: {"event":"status","message":"Starting"}\n\n',
      'data: {"event":"token","token":"Hello "}\n\n',
      'data: {"event":"token","token":"world"}\n\n',
      'data: {"event":"complete","answer":"Hello world","followUpQuestions":["Q1?"]}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(stream);

    const tokens: string[] = [];
    const complete = await streamChatResponse("hello", [], {
      onToken: (token) => tokens.push(token),
    });

    expect(tokens).toEqual(["Hello ", "world"]);
    expect(complete).toEqual({
      event: "complete",
      answer: "Hello world",
      followUpQuestions: ["Q1?"],
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [
      string,
      { body: string },
    ];
    expect(url).toBe("/api/chat/stream");
    expect(JSON.parse(init.body)).toEqual({ content: "hello", history: [] });
  });

  it("handles chunks split mid-event", async () => {
    const stream = sseStream([
      'data: {"event":"token","tok',
      'en":"Hel',
      'lo"}\n\n',
      'data: {"event":"complete","answer":"Hello"}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(stream);

    const tokens: string[] = [];
    await streamChatResponse("hello", [], {
      onToken: (token) => tokens.push(token),
    });

    expect(tokens).toEqual(["Hello"]);
  });

  it("throws on error events", async () => {
    const stream = sseStream([
      'data: {"event":"token","token":"Hi"}\n\n',
      'data: {"error":"Quota exceeded","code":429}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(stream);

    await expect(
      streamChatResponse("hello", [], { onError: vi.fn() }),
    ).rejects.toThrow("Quota exceeded");
  });

  it("throws when the stream ends without a complete event", async () => {
    const stream = sseStream([
      'data: {"event":"token","token":"Hi"}\n\n',
      'data: {"event":"status","message":"done"}\n\n',
    ]);
    vi.mocked(fetch).mockResolvedValue(stream);

    await expect(streamChatResponse("hello", [])).rejects.toThrow(
      "Stream ended without a complete event",
    );
  });
});

describe("useChatStream", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders optimistic user message and streams the assistant reply", async () => {
    const stream = sseStream([
      'data: {"event":"token","token":"Ang iyong WBC ay "}\n\n',
      'data: {"event":"token","token":"normal."}\n\n',
      'data: {"event":"complete","answer":"Ang iyong WBC ay normal."}\n\n',
    ]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(stream));

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Ano ang WBC ko?");
    });

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({
      role: "user",
      content: "Ano ang WBC ko?",
    });
    expect(result.current.messages[1]).toMatchObject({
      role: "assistant",
      content: "Ang iyong WBC ay normal.",
    });
  });

  it("removes the placeholder and surfaces an error when streaming fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("hello");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.error).toBe("network");
  });
});
