import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { executeFallbackChain } from "../geminiPipeline";

describe("Gemini Pipeline", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Collapse retry backoff: the default retry budget alone exceeds the test
    // timeout, which is what made this suite flaky.
    process.env.MODEL_MAX_RETRIES = "0";
    process.env.PIPELINE_MAX_RETRIES = "0";
    process.env.MODEL_TIMEOUT = "1000";
    vi.restoreAllMocks();

    // The shared vitest setup defines GEMINI_API_KEY, so without this stub the
    // fallback chain reaches the real Gemini endpoint and the suite fails on
    // network latency rather than on behaviour.
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          text: () => Promise.resolve("stubbed: no network in tests"),
          json: () => Promise.resolve({}),
        } as unknown as Response),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("executeFallbackChain", () => {
    it(
      "returns a result with expected structure",
      { timeout: 30000 },
      async () => {
        const result = await executeFallbackChain("", "", "en");
        expect(result).toHaveProperty("extractedData");
        expect(result).toHaveProperty("path");
        expect(result).toHaveProperty("confidence");
        expect(result).toHaveProperty("processingTimeMs");
        expect(result).toHaveProperty("warnings");
      },
    );

    it("handles empty inputs gracefully", { timeout: 30000 }, async () => {
      const result = await executeFallbackChain("", "", "fil");
      expect(result.warnings).toBeDefined();
      expect(typeof result.confidence).toBe("number");
    });
  });
});
