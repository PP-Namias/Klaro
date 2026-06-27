import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getFallbackConfig,
  shouldUseFallback,
  generateMockPatientData,
  generateMockLabResults,
  geminiFallback,
  formatFallbackResponse,
} from "../geminiFallback";

describe("Gemini Fallback", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("getFallbackConfig", () => {
    it("returns default config", () => {
      delete process.env.GEMINI_FALLBACK_ENABLED;
      delete process.env.GEMINI_MOCK_DELAY;
      delete process.env.GEMINI_LOG_FALLBACK;

      const config = getFallbackConfig();
      expect(config.enabled).toBe(true);
      expect(config.mockDelay).toBe(100);
    });

    it("reads env vars", () => {
      process.env.GEMINI_FALLBACK_ENABLED = "false";
      process.env.GEMINI_MOCK_DELAY = "500";
      process.env.GEMINI_LOG_FALLBACK = "true";

      const config = getFallbackConfig();
      expect(config.enabled).toBe(false);
      expect(config.mockDelay).toBe(500);
      expect(config.logFallback).toBe(true);
    });
  });

  describe("shouldUseFallback", () => {
    it("returns true for API key error", () => {
      const config = { enabled: true };
      expect(shouldUseFallback(new Error("API key not configured"), config)).toBe(true);
    });

    it("returns true for rate limit", () => {
      const config = { enabled: true };
      expect(shouldUseFallback({ code: 429 }, config)).toBe(true);
    });

    it("returns true for server errors", () => {
      const config = { enabled: true };
      expect(shouldUseFallback({ code: 500 }, config)).toBe(true);
      expect(shouldUseFallback({ code: 503 }, config)).toBe(true);
    });

    it("returns false when disabled", () => {
      const config = { enabled: false };
      expect(shouldUseFallback({ code: 429 }, config)).toBe(false);
    });

    it("returns false for client errors", () => {
      const config = { enabled: true };
      expect(shouldUseFallback({ code: 400 }, config)).toBe(false);
      expect(shouldUseFallback({ code: 401 }, config)).toBe(false);
    });
  });

  describe("generateMockPatientData", () => {
    it("generates complete mock data", () => {
      const data = generateMockPatientData();
      expect(data.patientName).toBeDefined();
      expect(data.diagnosis).toBeDefined();
      expect(data.medications).toBeDefined();
      expect(data.labResults).toBeDefined();
    });

    it("includes valid structure", () => {
      const data = generateMockPatientData();
      expect(Array.isArray(data.diagnosis)).toBe(true);
      expect(Array.isArray(data.medications)).toBe(true);
      expect(Array.isArray(data.labResults)).toBe(true);
    });
  });

  describe("generateMockLabResults", () => {
    it("generates lab-specific mock data", () => {
      const data = generateMockLabResults();
      expect(data.labResults).toBeDefined();
      expect((data.labResults as any[]).length).toBeGreaterThan(0);
    });

    it("includes lab result fields", () => {
      const data = generateMockLabResults();
      const labResults = data.labResults as any[];
      expect(labResults[0].testName).toBeDefined();
      expect(labResults[0].value).toBeDefined();
      expect(labResults[0].unit).toBeDefined();
    });
  });

  describe("geminiFallback", () => {
    it("returns mock data when enabled", async () => {
      process.env.GEMINI_FALLBACK_ENABLED = "true";
      process.env.GEMINI_MOCK_DELAY = "0";

      const result = await geminiFallback("base64data");
      expect(result.isMock).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("returns lab results for lab document type", async () => {
      process.env.GEMINI_FALLBACK_ENABLED = "true";
      process.env.GEMINI_MOCK_DELAY = "0";

      const result = await geminiFallback("base64data", "lab_result");
      expect(result.isMock).toBe(true);
      expect(result.data.labResults).toBeDefined();
    });

    it("throws when disabled", async () => {
      process.env.GEMINI_FALLBACK_ENABLED = "false";

      await expect(geminiFallback("base64data")).rejects.toThrow("Fallback is disabled");
    });

    it("logs fallback when configured", async () => {
      process.env.GEMINI_FALLBACK_ENABLED = "true";
      process.env.GEMINI_MOCK_DELAY = "0";
      process.env.GEMINI_LOG_FALLBACK = "true";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await geminiFallback("base64data");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe("formatFallbackResponse", () => {
    it("adds fallback metadata", () => {
      const result = {
        data: { patientName: "John" },
        isMock: true,
        fallbackReason: "API unavailable",
      };

      const formatted = formatFallbackResponse(result);
      expect(formatted.patientName).toBe("John");
      expect(formatted._fallback).toBeDefined();
      expect((formatted._fallback as any).isMock).toBe(true);
      expect((formatted._fallback as any).reason).toBe("API unavailable");
    });
  });
});
