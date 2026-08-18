import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../route";

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: new Headers({ Authorization: "Bearer test-token" }),
  } as unknown as NextRequest;
}

function sseResponse(body: string): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    },
  );
}

describe("POST /api/chat/stream proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when content is missing", async () => {
    const res = await POST(makeRequest({ history: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "content is required in the request body",
    });
  });

  it("forwards question + history to the sidecar and pipes the SSE stream", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(
        sseResponse('data: {"event":"token","token":"Hello"}\n\n'),
      );

    const res = await POST(
      makeRequest({
        content: "what is my WBC?",
        history: [
          { role: "user", content: "hi" },
          { role: "assistant", content: "hello" },
        ],
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/chat/stream",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        }),
        body: JSON.stringify({
          question: "what is my WBC?",
          messages: [
            { role: "user", content: "hi" },
            { role: "assistant", content: "hello" },
          ],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(res.headers.get("cache-control")).toBe("no-cache");

    const text = await new Response(res.body).text();
    expect(text).toContain('"token":"Hello"');
  });

  it("normalizes unknown history roles to assistant", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(
      makeRequest({
        content: "hello",
        history: [{ role: "system", content: "sys" }],
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toEqual({
      question: "hello",
      messages: [{ role: "assistant", content: "sys" }],
    });
  });

  it("returns 500 JSON when the sidecar is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Streaming proxy failed" });
  });

  it("returns 500 JSON when the sidecar responds with an error status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("boom", { status: 503 }));

    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Streaming proxy failed" });
  });
});
