import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getPipelineConfig,
  executePlainLanguageStage,
} from "../geminiPipeline";

describe("Gemini Pipeline", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("getPipelineConfig", () => {
    it("returns default config", () => {
      delete process.env.PIPELINE_ENABLE_OCR;
      delete process.env.PIPELINE_ENABLE_GEMINI;
      delete process.env.PIPELINE_ENABLE_FALLBACK;
      delete process.env.PIPELINE_LANGUAGE;

      const config = getPipelineConfig();
      expect(config.enableOcr).toBe(true);
      expect(config.enableGemini).toBe(true);
      expect(config.enableFallback).toBe(true);
      expect(config.language).toBe("en");
    });

    it("reads env vars", () => {
      process.env.PIPELINE_ENABLE_OCR = "false";
      process.env.PIPELINE_ENABLE_GEMINI = "false";
      process.env.PIPELINE_LANGUAGE = "fil";

      const config = getPipelineConfig();
      expect(config.enableOcr).toBe(false);
      expect(config.enableGemini).toBe(false);
      expect(config.language).toBe("fil");
    });
  });

  describe("executePlainLanguageStage", () => {
    it("generates plain language summary", async () => {
      const data = {
        patientName: "John Doe",
        diagnosis: ["Hypertension"],
        medications: [{ name: "Amlodipine", dosage: "5mg" }],
      };

      const result = await executePlainLanguageStage(data, "en");
      expect(result.text).toContain("John Doe");
      expect(result.timeMs).toBeGreaterThanOrEqual(0);
    });

    it("handles empty data", async () => {
      const result = await executePlainLanguageStage({});
      expect(result.text).toBeDefined();
    });

    it("handles Filipino language", async () => {
      const data = { patientName: "Juan" };
      const result = await executePlainLanguageStage(data, "fil");
      expect(result.text).toBeDefined();
    });
  });
});
