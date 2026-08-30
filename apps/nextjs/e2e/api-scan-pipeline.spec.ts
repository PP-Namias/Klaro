import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// The app is ESM, so __dirname does not exist here.
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Request-level tests against the running Docker stack. These hit tRPC and the
 * scan backend directly so a failure points at a layer rather than at a page.
 */

const SCAN_API = process.env.E2E_SCAN_API_URL ?? "http://localhost:3101";
const SIDECAR = process.env.E2E_AI_SIDECAR_URL ?? "http://localhost:3102";

const labReportBase64 = () =>
  readFileSync(join(here, "fixtures", "lab-report.jpg")).toString("base64");

const trpcInput = (value: unknown) => ({ json: value });

test.describe("scan-api service", () => {
  test("reports healthy", async ({ request }) => {
    const res = await request.get(`${SCAN_API}/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });

  test("OCR extracts text from a lab report", async ({ request }) => {
    const res = await request.post(`${SCAN_API}/api/ocr`, {
      data: { imageBase64: labReportBase64() },
      timeout: 180_000,
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    // Regression guard: tesseract used to be bundled into the Next server,
    // where its forked worker resolved to a /ROOT/ path that does not exist
    // and the request hung forever instead of failing.
    expect(body.text).toContain("Hemoglobin");
    expect(body.text).toContain("Cholesterol");
    expect(body.confidence).toBeGreaterThan(0.5);
  });

  test("rejects a body that is not a usable image", async ({ request }) => {
    const res = await request.post(`${SCAN_API}/api/ocr`, {
      data: { imageBase64: "tooshort" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("invalid_image");
  });

  test("accepts payloads above Express's 100kb default body limit", async ({
    request,
  }) => {
    // The default express.json() limit silently rejected every real image.
    const base64 = labReportBase64();
    expect(base64.length).toBeGreaterThan(100 * 1024);

    const res = await request.post(`${SCAN_API}/api/ocr`, {
      data: { imageBase64: base64 },
      timeout: 180_000,
    });
    expect(res.status()).toBe(200);
  });
});

test.describe("guest scan pipeline", () => {
  test("returns an analysis without any authentication", async ({
    request,
  }) => {
    const res = await request.post("/api/trpc/documents.scanGuestImage", {
      data: trpcInput({
        base64Image: labReportBase64(),
        fileName: "lab-report.jpg",
        language: "English",
      }),
      timeout: 180_000,
    });

    expect(res.status()).toBe(200);
    const payload = await res.json();
    const result = payload.result.data.json;

    expect(result.status).toBe("completed");
    expect(result.analysis.summary).toBeTruthy();
    expect(["LOW", "MODERATE", "HIGH"]).toContain(result.analysis.urgency);
    expect(Array.isArray(result.analysis.recommendations)).toBe(true);
  });

  test("completes well inside the old hang window", async ({ request }) => {
    const startedAt = Date.now();
    const res = await request.post("/api/trpc/documents.scanGuestImage", {
      data: trpcInput({
        base64Image: labReportBase64(),
        fileName: "lab-report.jpg",
        language: "English",
      }),
      timeout: 120_000,
    });
    expect(res.status()).toBe(200);
    expect(Date.now() - startedAt).toBeLessThan(60_000);
  });

  test("rejects an image below the minimum size", async ({ request }) => {
    const res = await request.post("/api/trpc/documents.scanGuestImage", {
      data: trpcInput({ base64Image: "abc", language: "English" }),
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Clara", () => {
  test("answers a guest over the streaming endpoint", async ({ request }) => {
    const res = await request.post("/api/chat/stream", {
      data: {
        content: "What does high LDL cholesterol mean?",
        history: [],
        metadata: { threadId: "guest-e2e-stream" },
      },
      timeout: 90_000,
    });

    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('"event":"complete"');
  });

  test("answers a guest over the non-streaming fallback", async ({
    request,
  }) => {
    const res = await request.post("/api/trpc/chat.sendGuestMessage", {
      data: trpcInput({
        guestId: "guest-e2e-fallback",
        content: "What does my cholesterol result mean?",
        dialect: "English",
        scanContext: {
          summary: "Elevated LDL cholesterol",
          urgency: "MODERATE",
        },
        history: [],
      }),
      timeout: 90_000,
    });

    expect(res.status()).toBe(200);
    const result = (await res.json()).result.data.json;
    expect(result.role).toBe("assistant");
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.blocked).toBe(false);
  });

  test("sidecar reports healthy", async ({ request }) => {
    const res = await request.get(`${SIDECAR}/api/health`);
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toMatch(/ok|healthy/);
  });
});
