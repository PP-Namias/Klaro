import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../index.js";
import { signJwt } from "../middleware/auth.js";
import { graph } from "../retrieval_graph/graph.js";

const TEST_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";

function bearer(claims: Record<string, unknown> = {}): string {
  return `Bearer ${signJwt(
    {
      tenantId: "tenant-a",
      patientId: "patient-1",
      role: "patient",
      ...claims,
    },
    TEST_SECRET,
  )}`;
}

vi.mock("../retrieval_graph/graph.js", () => ({
  graph: {
    streamEvents: vi.fn(async function* () {
      yield {
        event: "on_chat_model_stream",
        data: { chunk: { content: "Hello " } },
      };
      yield {
        event: "on_chat_model_stream",
        data: {
          chunk: { content: [{ type: "text", text: "world" }] },
        },
      };
      yield {
        event: "on_chat_model_stream",
        data: {
          chunk: {
            content: [
              {
                type: "tool_use",
                id: "call_1",
                name: "search",
                input: { query: "x" },
              },
            ],
          },
        },
      };
      yield {
        event: "on_chat_model_stream",
        data: { chunk: { content: "!" } },
      };
      yield {
        event: "on_chain_end",
        name: "generate",
        data: { output: { answer: "Hello world!" } },
      };
      yield {
        event: "on_chain_end",
        name: "followUp",
        data: { output: { followUpQuestions: ["Q1?", "Q2?"] } },
      };
    }),
  },
}));

describe("GET /api/chat/stream", () => {
  it("returns 400 when question is missing", async () => {
    const res = await request(app)
      .get("/api/chat/stream")
      .set("Authorization", bearer());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("question query parameter is required");
  });

  it("requires a bearer token", async () => {
    const res = await request(app).get("/api/chat/stream?question=hello");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing or invalid authorization header");
  });

  it("returns 400 when messages is invalid JSON", async () => {
    const res = await request(app)
      .get("/api/chat/stream?question=hello&messages=not-json")
      .set("Authorization", bearer());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid messages JSON");
  });

  it("streams tokens (string + content-block chunks) and a complete event", async () => {
    const res = await request(app)
      .get("/api/chat/stream?question=hello")
      .set("Authorization", bearer())
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.headers["cache-control"]).toBe("no-cache");
    expect(res.headers["connection"]).toBe("keep-alive");

    const body = res.body as string;
    expect(body).toContain('"event":"token"');
    expect(body).toContain('"token":"Hello "');
    expect(body).toContain('"token":"world"');
    expect(body).toContain('"token":"!"');
    expect(body).toContain('"event":"complete"');
    expect(body).toContain('"answer":"Hello world!"');
    expect(body).toContain('"followUpQuestions":["Q1?","Q2?"]');
  });

  it("sends the answer once when no tokens streamed (on_chain_end fallback)", async () => {
    vi.mocked(graph.streamEvents).mockImplementationOnce(async function* () {
      yield {
        event: "on_chain_end",
        name: "emptyAnswer",
        data: { output: { answer: "Full answer only" } },
      };
    } as never);

    const res = await request(app)
      .get("/api/chat/stream?question=hello")
      .set("Authorization", bearer())
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    const body = res.body as string;
    expect(body).toContain('"token":"Full answer only"');
    expect(body).toContain('"answer":"Full answer only"');
  });
});

describe("POST /api/chat/stream", () => {
  it("returns 400 when question is missing", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("question is required in the request body");
  });

  it("rejects requests without credentials", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .send({ question: "hello" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing or invalid authorization header");
  });

  it("rejects requests with an invalid token", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set(
        "Authorization",
        `Bearer ${signJwt({ tenantId: "tenant-a" }, "wrong-secret")}`,
      )
      .send({ question: "hello" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Invalid token");
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({ question: "hello", messages: "not-an-array" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid messages array");
  });

  it("streams tokens and a complete event from a JSON body", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({
        question: "hello",
        messages: [
          { role: "user", content: "what is my WBC?" },
          { role: "assistant", content: "Your WBC is normal." },
        ],
      })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.headers["cache-control"]).toBe("no-cache");

    const body = res.body as string;
    expect(body).toContain('"event":"token"');
    expect(body).toContain('"token":"Hello "');
    expect(body).toContain('"token":"world"');
    expect(body).toContain('"event":"complete"');
    expect(body).toContain('"answer":"Hello world!"');
    expect(body).toContain('"followUpQuestions":["Q1?","Q2?"]');
  });

  it("sends the current question with an image as a vision content block", async () => {
    const image = "data:image/png;base64,iVBORw0KGgo=";
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({ question: "what is in this scan?", image })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);
    expect(res.body as string).toContain('"event":"complete"');

    const { messages } = vi
      .mocked(graph.streamEvents)
      .mock.calls.at(-1)?.[0] as { messages: unknown[] };
    const current = messages[messages.length - 1] as {
      content: { type: string; image_url?: { url: string } }[];
    };
    expect(Array.isArray(current.content)).toBe(true);
    expect(current.content[0]).toEqual({
      type: "text",
      text: "what is in this scan?",
    });
    expect(current.content[1]).toEqual({
      type: "image_url",
      image_url: { url: image },
    });
  });

  it("drops invalid image payloads and sends plain text", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({ question: "hello", image: "not-a-data-uri" })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);

    const { messages } = vi
      .mocked(graph.streamEvents)
      .mock.calls.at(-1)?.[0] as { messages: unknown[] };
    const current = messages[messages.length - 1] as { content: string };
    expect(current.content).toBe("hello");
  });

  it("restricts retrieval to the public FAQ namespace for guest mode", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .send({
        question: "what is hypertension?",
        metadata: { guestMode: true },
      })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);
    expect(res.body as string).toContain('"event":"complete"');

    const [, options] = vi.mocked(graph.streamEvents).mock.calls.at(-1) ?? [];
    expect(options).toEqual({
      version: "v2",
      configurable: {
        tenantId: "public",
        patientId: "guest",
        filterKwargs: { namespace: "public_faq", tenantId: "public" },
        k: 3,
      },
    });
  });

  it("isolates retrieval to the verified tenant for authenticated requests", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({ question: "hello" })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);

    const [, options] = vi.mocked(graph.streamEvents).mock.calls.at(-1) ?? [];
    expect(options).toEqual({
      version: "v2",
      configurable: {
        tenantId: "tenant-a",
        patientId: "patient-1",
        filterKwargs: { tenantId: "tenant-a" },
      },
    });
  });

  it("ignores tenant IDs injected into the request body", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .set("Authorization", bearer())
      .send({
        question: "hello",
        metadata: { tenantId: "evil-tenant" },
      })
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);

    const [, options] = vi.mocked(graph.streamEvents).mock.calls.at(-1) ?? [];
    expect(options).toEqual({
      version: "v2",
      configurable: {
        tenantId: "tenant-a",
        patientId: "patient-1",
        filterKwargs: { tenantId: "tenant-a" },
      },
    });
  });

  it("propagates tenant isolation for authenticated GET requests", async () => {
    const res = await request(app)
      .get("/api/chat/stream?question=hello")
      .set("Authorization", bearer())
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          cb(null, data);
        });
      });

    expect(res.status).toBe(200);

    const [, options] = vi.mocked(graph.streamEvents).mock.calls.at(-1) ?? [];
    expect(options).toEqual({
      version: "v2",
      configurable: {
        tenantId: "tenant-a",
        patientId: "patient-1",
        filterKwargs: { tenantId: "tenant-a" },
      },
    });
  });
});
