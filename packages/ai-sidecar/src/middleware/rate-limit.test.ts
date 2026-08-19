import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "./auth.js";
import { rateLimiter, resetRateLimitStore } from "./rate-limit.js";

const originalMax = process.env.RATE_LIMIT_MAX_REQUESTS;
const originalWindow = process.env.RATE_LIMIT_WINDOW_MS;

function makeApp(user: AuthUser) {
  const app = express();
  app.use(express.json());
  app.use((req: { user?: AuthUser }, _res, next) => {
    req.user = user;
    next();
  });
  const router = express.Router();
  router.post("/limited", rateLimiter, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(router);
  return app;
}

const tenantUser: AuthUser = {
  tenantId: "tenant-a",
  patientId: "patient-1",
  role: "patient",
};
const guestUser: AuthUser = {
  tenantId: "public",
  patientId: "guest",
  role: "guest",
};

describe("rateLimiter", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "3";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    resetRateLimitStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimitStore();
    if (originalMax === undefined) {
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
    } else {
      process.env.RATE_LIMIT_MAX_REQUESTS = originalMax;
    }
    if (originalWindow === undefined) {
      delete process.env.RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.RATE_LIMIT_WINDOW_MS = originalWindow;
    }
  });

  it("allows requests under the threshold", async () => {
    const app = makeApp(tenantUser);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/limited").send({});
      expect(res.status).toBe(200);
    }
  });

  it("blocks requests over the threshold with 429 and a reset time", async () => {
    const app = makeApp(tenantUser);
    for (let i = 0; i < 3; i++) {
      await request(app).post("/limited").send({});
    }
    const res = await request(app).post("/limited").send({});
    expect(res.status).toBe(429);
    expect(res.body.error).toBe(
      "Rate limit exceeded. Please wait before sending more messages.",
    );
    expect(typeof res.body.resetAt).toBe("number");
    expect(res.body.resetAt).toBeGreaterThan(Date.now());
  });

  it("resets the window once it expires", async () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const app = makeApp(tenantUser);
    for (let i = 0; i < 3; i++) {
      await request(app).post("/limited").send({});
    }
    expect((await request(app).post("/limited").send({})).status).toBe(429);

    vi.setSystemTime(new Date("2026-01-01T00:01:01Z"));
    const res = await request(app).post("/limited").send({});
    expect(res.status).toBe(200);
  });

  it("uses separate buckets for different tenants", async () => {
    const appA = makeApp(tenantUser);
    for (let i = 0; i < 3; i++) {
      await request(appA).post("/limited").send({});
    }
    expect((await request(appA).post("/limited").send({})).status).toBe(429);

    const otherTenant: AuthUser = {
      tenantId: "tenant-b",
      patientId: "patient-2",
      role: "patient",
    };
    const appB = makeApp(otherTenant);
    for (let i = 0; i < 3; i++) {
      const res = await request(appB).post("/limited").send({});
      expect(res.status).toBe(200);
    }
  });

  it("buckets guest requests by IP", async () => {
    const app = makeApp(guestUser);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post("/limited").send({});
      expect(res.status).toBe(200);
    }
    const blocked = await request(app).post("/limited").send({});
    expect(blocked.status).toBe(429);
  });

  it("does not share guest and tenant buckets", async () => {
    const app = makeApp(guestUser);
    await request(app).post("/limited").send({});
    await request(app).post("/limited").send({});

    const tenantApp = makeApp(tenantUser);
    const res = await request(tenantApp).post("/limited").send({});
    expect(res.status).toBe(200);
  });
});
