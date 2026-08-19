import { createHmac } from "crypto";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AuthenticatedRequest } from "./auth.js";
import { requireAuth, signJwt, verifyJwt } from "./auth.js";

const SECRET = "test-jwt-secret";
const originalSecret = process.env.JWT_SECRET;

function makeApp() {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  router.post("/protected", requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });
  app.use(router);
  return app;
}

describe("verifyJwt", () => {
  it("verifies a token signed with the same secret", () => {
    const token = signJwt(
      { tenantId: "tenant-a", patientId: "patient-1", role: "patient" },
      SECRET,
    );
    const claims = verifyJwt(token, SECRET);
    expect(claims.tenantId).toBe("tenant-a");
    expect(claims.patientId).toBe("patient-1");
    expect(claims.role).toBe("patient");
    expect(typeof claims.iat).toBe("number");
    expect(typeof claims.exp).toBe("number");
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signJwt({ tenantId: "tenant-a" }, "other-secret");
    expect(() => verifyJwt(token, SECRET)).toThrow("Invalid token signature");
  });

  it("rejects expired tokens", () => {
    const token = signJwt({ tenantId: "tenant-a" }, SECRET, -60);
    expect(() => verifyJwt(token, SECRET)).toThrow("Token expired");
  });

  it("rejects malformed tokens", () => {
    expect(() => verifyJwt("not-a-token", SECRET)).toThrow("Malformed token");
    expect(() => verifyJwt("a.b", SECRET)).toThrow("Malformed token");
    expect(() => verifyJwt("a.b.c.d", SECRET)).toThrow("Malformed token");
  });

  it("rejects tokens with an unsupported algorithm", () => {
    const validToken = signJwt({ tenantId: "tenant-a" }, SECRET);
    const [, , signature] = validToken.split(".");
    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ tenantId: "tenant-a" }),
    ).toString("base64url");
    expect(() =>
      verifyJwt(`${header}.${payload}.${signature}`, SECRET),
    ).toThrow("Unsupported token algorithm");
  });

  it("rejects tokens with a non-JSON payload", () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payload = Buffer.from("not-json").toString("base64url");
    const signature = createHmac("sha256", SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");
    expect(() =>
      verifyJwt(`${header}.${payload}.${signature}`, SECRET),
    ).toThrow("Malformed token payload");
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("rejects requests without an Authorization header", async () => {
    const res = await request(makeApp()).post("/protected").send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing or invalid authorization header");
  });

  it("rejects non-Bearer Authorization headers", async () => {
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", "Token abc123")
      .send({});
    expect(res.status).toBe(401);
  });

  it("rejects tokens with an invalid signature", async () => {
    const token = signJwt(
      { tenantId: "tenant-a", patientId: "patient-1", role: "patient" },
      "wrong-secret",
    );
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden: Invalid token");
  });

  it("rejects expired tokens", async () => {
    const token = signJwt({ tenantId: "tenant-a" }, SECRET, -60);
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("rejects tokens without a tenantId claim", async () => {
    const token = signJwt({ patientId: "patient-1" }, SECRET);
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("attaches verified tenant, patient and role claims", async () => {
    const token = signJwt(
      { tenantId: "tenant-a", patientId: "patient-1", role: "doctor" },
      SECRET,
    );
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      tenantId: "tenant-a",
      patientId: "patient-1",
      role: "doctor",
    });
  });

  it("defaults missing patientId and role claims", async () => {
    const token = signJwt({ tenantId: "tenant-a" }, SECRET);
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      tenantId: "tenant-a",
      patientId: "patient",
      role: "patient",
    });
  });

  it("passes guest mode through with public context", async () => {
    const res = await request(makeApp())
      .post("/protected")
      .send({ metadata: { guestMode: true } });
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      tenantId: "public",
      patientId: "guest",
      role: "guest",
    });
  });

  it("strips tenant IDs injected into the body for guest mode", async () => {
    const res = await request(makeApp())
      .post("/protected")
      .send({
        question: "hi",
        metadata: { guestMode: true, tenantId: "injected-tenant" },
      });
    expect(res.status).toBe(200);
    expect(res.body.user.tenantId).toBe("public");
  });

  it("returns 500 when JWT_SECRET is not configured", async () => {
    delete process.env.JWT_SECRET;
    const token = signJwt({ tenantId: "tenant-a" }, SECRET);
    const res = await request(makeApp())
      .post("/protected")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Authentication is not configured");
  });
});
