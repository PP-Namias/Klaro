import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../route";

function makeRequest(
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return {
    json: async () => body,
    headers: new Headers(headers ?? { Authorization: "Bearer test-token" }),
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
          metadata: { guestMode: false },
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
      metadata: { guestMode: false },
    });
  });

  it("returns 500 JSON when the sidecar is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Streaming proxy failed" });
  });

  it("passes through sidecar error status and body", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("boom", { status: 503 }));

    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "boom" });
  });

  it("passes through 429 rate limit responses with the reset time", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            "Rate limit exceeded. Please wait before sending more messages.",
          resetAt: 1234567890,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    );

    const res = await POST(makeRequest({ content: "hello" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "Rate limit exceeded. Please wait before sending more messages.",
      resetAt: 1234567890,
    });
  });

  it("forwards a data-URI image to the sidecar", async () => {
    const image = "data:image/png;base64,iVBORw0KGgo=";
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(makeRequest({ content: "what is this?", image }));

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(init.body) as { image?: string };
    expect(body.image).toBe(image);
  });

  it("strips images that are not data URIs", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(
      makeRequest({
        content: "what is this?",
        image: "https://evil.example/x.png",
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    const body = JSON.parse(init.body) as { image?: string };
    expect(body.image).toBeUndefined();
  });

  it("rejects oversized image payloads with 413", async () => {
    const huge = `data:image/png;base64,${"A".repeat(11 * 1024 * 1024)}`;

    const res = await POST(makeRequest({ content: "hi", image: huge }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "Image payload too large" });
  });

  it("tags requests without an Authorization header as guest mode", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(makeRequest({ content: "what is diabetes?" }, {}));

    const [, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toMatchObject({
      question: "what is diabetes?",
      metadata: { guestMode: true, tenantId: "public" },
    });
  });

  it("forwards threadId metadata and tenantId for authenticated users", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(
      makeRequest(
        {
          content: "hello",
          metadata: { threadId: "guest_abc", tenantId: "clinic-1" },
        },
        { Authorization: "Bearer test-token" },
      ),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toMatchObject({
      metadata: {
        guestMode: false,
        tenantId: "clinic-1",
        threadId: "guest_abc",
      },
    });
  });

  it("forces tenantId to public for guest requests even when one is supplied", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(sseResponse(""));

    await POST(
      makeRequest({ content: "hello", metadata: { tenantId: "clinic-1" } }, {}),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toMatchObject({
      metadata: { guestMode: true, tenantId: "public" },
    });
  });
});
