import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../route";

describe("/api/maps/nearby", () => {
  it.skip("GET without params should return 400", async () => {
    const req = new Request("http://localhost/api/maps/nearby");
    // call exported handler directly
    const res = await GET(req as any);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body && typeof body.error === "string");
  });

  it.skip("GET with query params should return 200 and array", async () => {
    const req = new Request(
      "http://localhost/api/maps/nearby?latitude=14.5995&longitude=120.9842&radiusKm=5",
    );
    const res = await GET(req as any);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
  });

  it.skip("POST with JSON body should return 200 and array", async () => {
    const req = new Request("http://localhost/api/maps/nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 14.5995, longitude: 120.9842, radiusKm: 5 }),
    });
    const res = await POST(req as any);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
  });
});
