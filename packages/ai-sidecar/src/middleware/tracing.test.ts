import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "./auth.js";
import { tracingMiddleware } from "./tracing.js";

function makeApp(user?: AuthUser) {
  const app = express();
  app.use(tracingMiddleware);
  const router = express.Router();
  router.get("/probe", (req, res) => {
    res.json({ correlationId: req.headers["x-correlation-id"] });
  });
  router.get("/authed", (req, res) => {
    if (user) {
      (req as { user?: AuthUser }).user = user;
    }
    res.json({ ok: true });
  });
  app.use(router);
  return app;
}

describe("tracingMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a correlation id when no trace headers are present", async () => {
    const res = await request(makeApp()).get("/probe");
    expect(res.status).toBe(200);
    expect(res.body.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses the Datadog trace id header", async () => {
    const res = await request(makeApp())
      .get("/probe")
      .set("X-Datadog-Trace-Id", "dd-trace-123");
    expect(res.status).toBe(200);
    expect(res.body.correlationId).toBe("dd-trace-123");
  });

  it("reuses the AWS trace id header when Datadog is absent", async () => {
    const res = await request(makeApp())
      .get("/probe")
      .set("X-Amzn-Trace-Id", "aws-trace-456");
    expect(res.status).toBe(200);
    expect(res.body.correlationId).toBe("aws-trace-456");
  });

  it("emits a structured http_request log with trace fields", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const res = await request(makeApp())
      .get("/probe")
      .set("X-Datadog-Trace-Id", "dd-trace-123");
    expect(res.status).toBe(200);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0] as string;
    const entry = JSON.parse(line) as Record<string, unknown>;
    expect(entry.event).toBe("http_request");
    expect(entry.method).toBe("GET");
    expect(entry.path).toBe("/probe");
    expect(entry.status).toBe(200);
    expect(entry.trace_id).toBe("dd-trace-123");
    expect(entry.tenant_id).toBe("unauthenticated");
    expect(typeof entry.duration_ms).toBe("number");
    expect(entry.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("reports the tenant id once authentication has run", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const user: AuthUser = {
      tenantId: "tenant-a",
      patientId: "patient-1",
      role: "patient",
    };
    const res = await request(makeApp(user)).get("/authed");
    expect(res.status).toBe(200);

    const line = logSpy.mock.calls[0][0] as string;
    const entry = JSON.parse(line) as Record<string, unknown>;
    expect(entry.tenant_id).toBe("tenant-a");
  });
});
