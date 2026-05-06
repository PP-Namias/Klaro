import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
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
    assert.ok(spec.includes("/api/auth/signin"));
    assert.ok(spec.includes("/api/auth/logout"));
    assert.ok(spec.includes("/api/auth/session"));
    assert.ok(spec.includes("/api/documents/scan"));
    assert.ok(spec.includes("/api/trpc/facilities.searchNearby"));
    assert.ok(spec.includes("/auth/callback"));
    assert.ok(spec.includes("/api/maps/nearby"));
    assert.ok(spec.includes("BearerAuth"));
    assert.ok(spec.includes("/api/trpc/health"));
    assert.ok(spec.includes("/api/trpc/version"));
    assert.ok(spec.includes("/api/trpc/me"));
    assert.ok(spec.includes("/api/trpc/documents.list"));
    assert.ok(spec.includes("/api/trpc/documents.setOcrResult"));
    assert.ok(spec.includes("/api/trpc/documents.processServerOcr"));
    assert.ok(spec.includes("/api/trpc/chat.sendMessage"));
    assert.ok(spec.includes("/api/trpc/chat.getHistory"));
    assert.ok(spec.includes("/api/trpc/chat.clearHistory"));
    assert.ok(spec.includes("/api/trpc/doctor.listDoctors"));
    assert.ok(spec.includes("/api/trpc/doctor.getDoctorById"));
    assert.ok(spec.includes("/api/trpc/doctor.createDoctor"));
    assert.ok(spec.includes("/api/trpc/doctor.updateDoctor"));
    assert.ok(spec.includes("/api/trpc/doctor.createAvailability"));
    assert.ok(spec.includes("/api/trpc/doctor.listAvailability"));
    assert.ok(spec.includes("/api/trpc/doctor.updateAvailability"));
    assert.ok(spec.includes("/api/trpc/doctor.deleteAvailability"));
    assert.ok(spec.includes("/api/trpc/admin.togglePrcVerification"));
    assert.ok(spec.includes("/api/trpc/facilities.list"));
    assert.ok(spec.includes("/api/trpc/facilities.searchNearby"));
    assert.ok(spec.includes("/api/trpc/facilities.bestSuggested"));
    assert.ok(spec.includes("/api/trpc/facilities.searchBySpecialty"));
  });
});
