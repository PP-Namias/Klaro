import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const openapiPath = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "nextjs",
  "public",
  "openapi.yaml",
);

describe("OpenAPI spec", () => {
  it("includes OCR tRPC endpoints", () => {
    const spec = readFileSync(openapiPath, "utf-8");

    assert.ok(spec.includes("openapi:"));
    assert.ok(spec.includes("/api/trpc/health"));
    assert.ok(spec.includes("/api/trpc/version"));
    assert.ok(spec.includes("/api/trpc/me"));
    assert.ok(spec.includes("/api/trpc/documents.list"));
    assert.ok(spec.includes("/api/trpc/documents.setOcrResult"));
    assert.ok(spec.includes("/api/trpc/documents.processServerOcr"));
    assert.ok(spec.includes("/api/trpc/chat.sendMessage"));
    assert.ok(spec.includes("/api/trpc/chat.getHistory"));
    assert.ok(spec.includes("/api/trpc/chat.clearHistory"));
  });
});
