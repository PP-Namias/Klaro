import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../index.js";

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("ai-sidecar");
  });
});
