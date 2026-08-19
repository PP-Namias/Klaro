import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AiSidecarClientError,
  chat,
  chatStreamURL,
  healthCheck,
  ingest,
} from "../aiSidecarClient";

afterEach(() => {
  vi.unstubAllGlobals();
});

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const errorResponse = (status: number, body: string) =>
  ({
    ok: false,
    status,
    json: async () => ({ error: body }),
    text: async () => body,
  }) as Response;

describe("aiSidecarClient", () => {
  it("chats with the sidecar and returns the answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        answer: "Your hemoglobin is within range.",
        followUpQuestions: ["Any symptoms?"],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat("What is my hemoglobin?", [
      { role: "user", content: "What is my hemoglobin?" },
    ]);

    expect(result.answer).toContain("hemoglobin");
    expect(result.followUpQuestions).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("What is my hemoglobin?"),
      }),
    );
  });

  it("throws AiSidecarClientError with status code on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse(500, "model exploded")),
    );

    await expect(chat("hello")).rejects.toMatchObject({
      name: "AiSidecarClientError",
      statusCode: 500,
      message: "model exploded",
    });
  });

  it("rejects an empty question without calling the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(chat("")).rejects.toBeInstanceOf(AiSidecarClientError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards an abort signal for timeouts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ answer: "a" }));
    vi.stubGlobal("fetch", fetchMock);

    const signal = AbortSignal.timeout(3000);
    await chat("hello", [], { signal });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.signal).toBe(signal);
  });

  it("builds the SSE stream URL with question and history", () => {
    const url = chatStreamURL("hello", [{ role: "user", content: "hi" }]);
    expect(url).toContain("/api/chat/stream");
    expect(url).toContain("question=hello");
    expect(url).toContain(
      encodeURIComponent(JSON.stringify([{ role: "user", content: "hi" }])),
    );
  });

  it("ingests a file as multipart form data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        okResponse({ status: "ok", ingested: true, docCount: 3 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const file = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    const result = await ingest(file, "report.pdf");

    expect(result.docCount).toBe(3);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("checks health", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(okResponse({ status: "ok" })),
    );

    const result = await healthCheck();
    expect(result.status).toBe("ok");
  });
});
