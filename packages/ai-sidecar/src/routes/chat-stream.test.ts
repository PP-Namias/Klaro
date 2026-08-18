import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../index.js";
import { graph } from "../retrieval_graph/graph.js";

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
    const res = await request(app).get("/api/chat/stream");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("question query parameter is required");
  });

  it("returns 400 when messages is invalid JSON", async () => {
    const res = await request(app).get(
      "/api/chat/stream?question=hello&messages=not-json",
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid messages JSON");
  });

  it("streams tokens (string + content-block chunks) and a complete event", async () => {
    const res = await request(app)
      .get("/api/chat/stream?question=hello")
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
    const res = await request(app).post("/api/chat/stream").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("question is required in the request body");
  });

  it("returns 400 when messages is not an array", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
      .send({ question: "hello", messages: "not-an-array" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid messages array");
  });

  it("streams tokens and a complete event from a JSON body", async () => {
    const res = await request(app)
      .post("/api/chat/stream")
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
});
