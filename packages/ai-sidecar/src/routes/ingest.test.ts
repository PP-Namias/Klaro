import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import app from "../index.js";
import { graph as ingestionGraph } from "../ingestion_graph/graph.js";

vi.mock("../ingestion_graph/graph.js", () => ({
  graph: { invoke: vi.fn() },
}));

describe("POST /api/ingest", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await request(app)
      .post("/api/ingest")
      .expect("Content-Type", /json/);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when file type is unsupported", async () => {
    const res = await request(app)
      .post("/api/ingest")
      .attach("file", Buffer.from("not a real file"), "test.txt");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 200 with the real docCount from the graph", async () => {
    vi.mocked(ingestionGraph.invoke).mockResolvedValue({
      docCount: 4,
    } as never);

    const res = await request(app)
      .post("/api/ingest")
      .attach("file", Buffer.from("%PDF-1.4\nfake pdf bytes"), "sample.pdf");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      ingested: true,
      docCount: 4,
    });
  });

  it("returns 500 when ingestion fails", async () => {
    vi.mocked(ingestionGraph.invoke).mockRejectedValue(
      new Error("vector store unreachable"),
    );

    const res = await request(app)
      .post("/api/ingest")
      .attach("file", Buffer.from("%PDF-1.4\nfake pdf bytes"), "sample.pdf");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("vector store unreachable");
  });
});
