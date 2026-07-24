import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildGeminiApiUrl,
  buildGeminiVisionPrompt,
  buildGeminiVisionRequest,
  callGeminiVision,
  getGeminiApiKey,
  isGeminiRetryableError,
  parseGeminiVisionResponse,
} from "../geminiVision";

describe("Gemini Vision API Client", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getGeminiApiKey", () => {
    it("returns API key from env", () => {
      process.env.GEMINI_API_KEY = "test-key";
      expect(getGeminiApiKey()).toBe("test-key");
    });

    it("returns null when env not set", () => {
      delete process.env.GEMINI_API_KEY;
      expect(getGeminiApiKey()).toBeNull();
    });
  });

  describe("buildGeminiApiUrl", () => {
    it("builds correct URL", () => {
      const url = buildGeminiApiUrl("key123", "gemini-2.5-flash");
      expect(url).toContain("generativelanguage.googleapis.com");
      expect(url).toContain("gemini-2.5-flash");
      expect(url).toContain("key=key123");
    });
  });

  describe("buildGeminiVisionPrompt", () => {
    it("builds extraction prompt", () => {
      const prompt = buildGeminiVisionPrompt();
      expect(prompt).toContain("patientName");
      expect(prompt).toContain("labResults");
      expect(prompt).toContain("medications");
    });

    it("includes document type when specified", () => {
      const prompt = buildGeminiVisionPrompt("lab result");
      expect(prompt).toContain("lab result");
    });

    it("requests JSON output", () => {
      const prompt = buildGeminiVisionPrompt();
      expect(prompt).toContain("JSON");
    });
  });

  describe("buildGeminiVisionRequest", () => {
    it("builds request with image and prompt", () => {
      const request = buildGeminiVisionRequest("base64data", "prompt");
      expect(request).toHaveProperty("contents");
      const contents = (request as any).contents[0].parts;
      expect(contents[0].inlineData.data).toBe("base64data");
      expect(contents[1].text).toBe("prompt");
    });

    it("sets generation config", () => {
      const request = buildGeminiVisionRequest("data", "prompt", {
        temperature: 0.5,
      });
      const config = (request as any).generationConfig;
      expect(config.temperature).toBe(0.5);
    });
  });

  describe("parseGeminiVisionResponse", () => {
    it("parses valid response", () => {
      const response = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"patientName": "John", "diagnosis": ["Hypertension"]}',
                },
              ],
            },
          },
        ],
        modelVersion: "gemini-2.5-flash",
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      };

      const result = parseGeminiVisionResponse(response);
      expect(result.structuredData?.patientName).toBe("John");
      expect(result.confidence).toBe(0.9);
      expect(result.usage?.totalTokens).toBe(150);
    });

    it("handles invalid JSON gracefully", () => {
      const response = {
        candidates: [{ content: { parts: [{ text: "not json" }] } }],
      };

      const result = parseGeminiVisionResponse(response);
      expect(result.text).toBe("not json");
      expect(result.structuredData).toBeUndefined();
      expect(result.confidence).toBe(0.5);
    });

    it("handles empty response", () => {
      const result = parseGeminiVisionResponse({});
      expect(result.text).toBe("");
      expect(result.structuredData).toBeUndefined();
    });
  });

  describe("isGeminiRetryableError", () => {
    it("returns true for rate limit", () => {
      expect(isGeminiRetryableError({ code: 429 })).toBe(true);
    });

    it("returns true for server errors", () => {
      expect(isGeminiRetryableError({ code: 500 })).toBe(true);
      expect(isGeminiRetryableError({ code: 503 })).toBe(true);
    });

    it("returns true for UNAVAILABLE", () => {
      expect(isGeminiRetryableError({ message: "UNAVAILABLE" })).toBe(true);
    });

    it("returns false for client errors", () => {
      expect(isGeminiRetryableError({ code: 400 })).toBe(false);
      expect(isGeminiRetryableError({ code: 401 })).toBe(false);
    });
  });

  describe("callGeminiVision", () => {
    it("throws when API key not configured", async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(callGeminiVision("data")).rejects.toThrow("not configured");
    });

    it("makes API call successfully", async () => {
      process.env.GEMINI_API_KEY = "test-key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: '{"patientName": "John"}' }],
                },
              },
            ],
            modelVersion: "gemini-2.5-flash",
          }),
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await callGeminiVision("base64data");
      expect(result.structuredData?.patientName).toBe("John");
    });

    it("retries on retryable errors", async () => {
      process.env.GEMINI_API_KEY = "test-key";

      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: { message: "Rate limited" } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              candidates: [
                { content: { parts: [{ text: '{"data": "ok"}' }] } },
              ],
            }),
        });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await callGeminiVision("data", { maxRetries: 2 });
      expect(result.structuredData).toBeDefined();
    });
  });
});
