import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../index.js";
import { checkVectorStoreHealth } from "../shared/retrieval.js";

vi.mock("../shared/retrieval.js", () => ({
  checkVectorStoreHealth: vi.fn(async () => undefined),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.mocked(checkVectorStoreHealth).mockResolvedValue(undefined);
  });

  it("returns healthy when the vector store probe succeeds", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.service).toBe("ai-sidecar");
    expect(res.body.version).toBe("1.0.0");
    expect(typeof res.body.uptime).toBe("number");
    expect(typeof res.body.timestamp).toBe("string");
    expect(checkVectorStoreHealth).toHaveBeenCalledTimes(1);
  });

  it("returns 503 degraded when the vector store is unreachable", async () => {
    vi.mocked(checkVectorStoreHealth).mockRejectedValue(
      new Error("vector store unreachable"),
    );
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("degraded");
    expect(res.body.error).toBe("Vector store unreachable");
  });
});
