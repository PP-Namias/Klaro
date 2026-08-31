import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildVisionApiUrl,
  buildVisionRequest,
  calculateRetryDelay,
  callGoogleVision,
  getCloudOcrApiKey,
  isRetryableError,
  parseVisionResponse,
} from "../cloudOcr";

describe("Cloud OCR Service", () => {
  const originalEnv = process.env.GOOGLE_VISION_API_KEY;

  beforeEach(() => {
    process.env.GOOGLE_VISION_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getCloudOcrApiKey", () => {
    it("returns API key from env", () => {
      process.env.GOOGLE_VISION_API_KEY = "test-key";
      expect(getCloudOcrApiKey()).toBe("test-key");
    });

    it("returns null when env not set", () => {
      delete process.env.GOOGLE_VISION_API_KEY;
      expect(getCloudOcrApiKey()).toBeNull();
    });
  });

  describe("buildVisionApiUrl", () => {
    it("keeps the API key out of the URL", () => {
      const url = buildVisionApiUrl("my-key");
      expect(url).toContain("vision.googleapis.com");
      // The key travels as an x-goog-api-key header: a query-string key is
      // captured by proxy and access logs.
      expect(url).not.toContain("my-key");
      expect(url).not.toContain("key=");
    });
  });

  describe("buildVisionRequest", () => {
    it("builds request with image content", () => {
      const request = buildVisionRequest("base64data");
      expect(request).toHaveProperty("requests");
      expect((request as any).requests[0].image.content).toBe("base64data");
    });

    it("includes language hints", () => {
      const request = buildVisionRequest("data");
      const hints = (request as any).requests[0].imageContext.languageHints;
      expect(hints).toContain("en");
      expect(hints).toContain("fil");
    });

    it("uses specified mime type", () => {
      const request = buildVisionRequest("data", "image/jpeg");
      expect(request).toBeDefined();
    });
  });

  describe("parseVisionResponse", () => {
    it("extracts text from response", () => {
      const response = {
        responses: [
          {
            fullTextAnnotation: {
              text: "Patient Name: John Doe",
              confidence: 0.95,
              pages: [],
            },
          },
        ],
      };

      const result = parseVisionResponse(response);
      expect(result.text).toBe("Patient Name: John Doe");
      expect(result.confidence).toBe(0.95);
    });

    it("handles empty response", () => {
      const result = parseVisionResponse({});
      expect(result.text).toBe("");
      expect(result.confidence).toBe(0);
      expect(result.blocks).toHaveLength(0);
    });

    it("extracts blocks from pages", () => {
      const response = {
        responses: [
          {
            fullTextAnnotation: {
              text: "Full text",
              confidence: 0.9,
              pages: [
                {
                  blocks: [
                    {
                      confidence: 0.85,
                      paragraphs: [
                        {
                          words: [
                            {
                              symbols: [
                                { text: "H" },
                                { text: "e" },
                                { text: "l" },
                                { text: "l" },
                                { text: "o" },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      };

      const result = parseVisionResponse(response);
      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.blocks[0].text).toContain("Hello");
    });
  });

  describe("isRetryableError", () => {
    it("returns true for rate limit", () => {
      expect(isRetryableError({ code: 429 })).toBe(true);
    });

    it("returns true for server errors", () => {
      expect(isRetryableError({ code: 500 })).toBe(true);
      expect(isRetryableError({ code: 503 })).toBe(true);
    });

    it("returns true for timeout", () => {
      expect(isRetryableError({ message: "timeout" })).toBe(true);
    });

    it("returns false for client errors", () => {
      expect(isRetryableError({ code: 400 })).toBe(false);
      expect(isRetryableError({ code: 401 })).toBe(false);
    });
  });

  describe("calculateRetryDelay", () => {
    it("calculates exponential backoff", () => {
      expect(calculateRetryDelay(0)).toBe(1000);
      expect(calculateRetryDelay(1)).toBe(2000);
      expect(calculateRetryDelay(2)).toBe(4000);
    });

    it("caps at max delay", () => {
      expect(calculateRetryDelay(10)).toBe(30000);
    });

    it("uses custom base delay", () => {
      expect(calculateRetryDelay(1, 500)).toBe(1000);
    });
  });

  describe("callGoogleVision", () => {
    it("throws when API key not configured", async () => {
      delete process.env.GOOGLE_VISION_API_KEY;
      await expect(callGoogleVision("data")).rejects.toThrow("not configured");
    });

    it("makes API call with correct parameters", async () => {
      process.env.GOOGLE_VISION_API_KEY = "test-key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            responses: [
              {
                fullTextAnnotation: {
                  text: "Test result",
                  confidence: 0.9,
                },
              },
            ],
          }),
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await callGoogleVision("base64data");
      expect(result.text).toBe("Test result");
      expect(mockFetch).toHaveBeenCalled();
    });

    it("retries on retryable errors", async () => {
      process.env.GOOGLE_VISION_API_KEY = "test-key";

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
              responses: [
                { fullTextAnnotation: { text: "Success", confidence: 0.9 } },
              ],
            }),
        });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await callGoogleVision("data", { maxRetries: 2 });
      expect(result.text).toBe("Success");
    });
  });
});
