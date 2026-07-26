import { beforeEach, describe, expect, it, vi } from "vitest";

import { executeFallbackChain } from "../geminiPipeline";

describe("Gemini Pipeline", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("executeFallbackChain", () => {
    it("returns a result with expected structure", async () => {
      const result = await executeFallbackChain("", "", "en");
      expect(result).toHaveProperty("extractedData");
      expect(result).toHaveProperty("path");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("processingTimeMs");
      expect(result).toHaveProperty("warnings");
    });

    it("handles empty inputs gracefully", async () => {
      const result = await executeFallbackChain("", "", "fil");
      expect(result.warnings).toBeDefined();
      expect(typeof result.confidence).toBe("number");
    });
  });
});
