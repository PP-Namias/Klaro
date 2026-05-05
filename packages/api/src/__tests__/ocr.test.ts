import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOcrResult,
  buildOcrAudit,
  computeConfidence,
  getOcrConfidenceThreshold,
  performOcrWithFallback,
} from "../services/ocr";

const createOcrResult = (
  source: "local" | "cloud",
  confidence: number,
  text: string,
) =>
  buildOcrResult({
    text,
    blocks: [{ text: "line", confidence }],
    source,
  });

const createLocalOcr = (confidence: number, text = "local") =>
  async () => createOcrResult("local", confidence, text);

const createCloudOcr = (confidence: number, text = "cloud") =>
  async () => createOcrResult("cloud", confidence, text);

describe("OCR service", () => {
  it("computes confidence from blocks", () => {
    const confidence = computeConfidence([
      { text: "a", confidence: 0.5 },
      { text: "b", confidence: 1 },
    ]);

    assert.ok(confidence > 0.5);
  });

  it("uses local OCR when confidence meets threshold", async () => {
    let cloudCalled = false;

    const localOcr = createLocalOcr(0.9);

    const cloudOcr = async () => {
      cloudCalled = true;
      return createOcrResult("cloud", 0.95, "cloud");
    };

    const { result, audit } = await performOcrWithFallback(Buffer.from("test"), {
      threshold: 0.7,
      localOcr,
      cloudOcr,
    });

    assert.equal(result.source, "local");
    assert.equal(audit.usedCloudFallback, false);
    assert.equal(cloudCalled, false);
  });

  it("falls back to cloud OCR when local confidence is low", async () => {
    const localOcr = createLocalOcr(0.2);
    const cloudOcr = createCloudOcr(0.95);

    const { result, audit } = await performOcrWithFallback(Buffer.from("test"), {
      threshold: 0.7,
      localOcr,
      cloudOcr,
    });

    assert.equal(result.source, "cloud");
    assert.ok(audit.cloud);
    assert.equal(audit.usedCloudFallback, true);
  });

  it("returns local OCR when cloud is unavailable", async () => {
    const localOcr = createLocalOcr(0.2);

    const cloudOcr = async () => null;

    const { result, audit } = await performOcrWithFallback(Buffer.from("test"), {
      threshold: 0.7,
      localOcr,
      cloudOcr,
    });

    assert.equal(result.source, "local");
    assert.equal(audit.usedCloudFallback, false);
  });

  it("builds an audit record for selected OCR results", () => {
    const local = createOcrResult("local", 0.4, "local");
    const cloud = createOcrResult("cloud", 0.9, "cloud");

    const audit = buildOcrAudit({
      local,
      cloud,
      selected: cloud,
      threshold: 0.7,
      usedCloudFallback: true,
    });

    assert.equal(audit.source, "cloud");
    assert.equal(audit.usedCloudFallback, true);
    assert.ok(audit.confidenceDelta > 0);
  });

  it("reads the OCR threshold from environment variables", () => {
    const previousThreshold = process.env.OCR_CONFIDENCE_THRESHOLD;

    process.env.OCR_CONFIDENCE_THRESHOLD = "0.83";

    try {
      assert.equal(getOcrConfidenceThreshold(), 0.83);
    } finally {
      if (previousThreshold === undefined) {
        delete process.env.OCR_CONFIDENCE_THRESHOLD;
      } else {
        process.env.OCR_CONFIDENCE_THRESHOLD = previousThreshold;
      }
    }
  });
});
