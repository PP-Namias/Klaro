import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanAnalysisInput } from "../scan-analysis";
import { callLLMAPI } from "../llm";
import { analyzeScan, analyzeScanBatch } from "../scan-analysis";

// Mock the LLM service
vi.mock("../llm", () => ({
  callLLMAPI: vi.fn(),
}));

const mockCallLLMAPI = callLLMAPI as ReturnType<typeof vi.fn>;

describe("Scan Analysis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeScan", () => {
    const validInput: ScanAnalysisInput = {
      extractedTests: [
        {
          name: "Hemoglobin A1c",
          value: "9.2",
          unit: "%",
          flagged: true,
        },
        {
          name: "Fasting glucose",
          value: "210",
          unit: "mg/dL",
          flagged: true,
        },
      ],
      patientAge: 45,
      patientSex: "female",
    };

    it("should successfully analyze with valid LLM response", async () => {
      const validResponse = JSON.stringify({
        summary: "Your blood sugar readings are elevated and concerning.",
        urgency: "HIGH",
        recommendations: [
          "Schedule appointment with Endocrinology within 2 days",
          "Monitor blood sugar at home",
          "Avoid high-sugar foods",
        ],
      });

      mockCallLLMAPI.mockResolvedValue(validResponse);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.urgency).toBe("HIGH");
      expect(result.analysis?.recommendations).toHaveLength(3);
      expect(result.source).toBe("llm");
    });

    it("should validate summary length constraint", async () => {
      const validResponse = JSON.stringify({
        summary: "A".repeat(501), // Exceeds 500 char limit
        urgency: "LOW",
        recommendations: ["Test"],
      });

      mockCallLLMAPI.mockResolvedValue(validResponse);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.analysis?.summary.length).toBeLessThanOrEqual(500);
      expect(result.source).toBe("fallback");
    });

    it("should validate urgency enum values", async () => {
      const invalidResponse = JSON.stringify({
        summary: "Test summary",
        urgency: "INVALID",
        recommendations: ["Test"],
      });

      mockCallLLMAPI.mockResolvedValue(invalidResponse);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(["LOW", "MODERATE", "HIGH"]).toContain(result.analysis?.urgency);
      expect(result.source).toBe("fallback");
    });

    it("should validate recommendations array constraints", async () => {
      const invalidResponse = JSON.stringify({
        summary: "Test",
        urgency: "LOW",
        recommendations: [], // Empty array
      });

      mockCallLLMAPI.mockResolvedValue(invalidResponse);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.source).toBe("fallback");
    });

    it("should handle missing test data", async () => {
      const result = await analyzeScan({
        extractedTests: [],
        patientAge: 45,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No test results");
    });

    it("should use fallback when LLM API fails", async () => {
      mockCallLLMAPI.mockRejectedValue(new Error("API Error"));

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.source).toBe("fallback");
      expect(result.analysis).toBeDefined();
    });

    it("should use fallback when LLM returns empty string", async () => {
      mockCallLLMAPI.mockResolvedValue("");

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.source).toBe("fallback");
      expect(result.analysis).toBeDefined();
    });

    it("should extract JSON from response with extra text", async () => {
      const responseWithExtra = `
        Some extra text here...
        ${JSON.stringify({
          summary: "Test summary",
          urgency: "LOW",
          recommendations: ["Test rec"],
        })}
        And more text after JSON
      `;

      mockCallLLMAPI.mockResolvedValue(responseWithExtra);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.analysis?.summary).toBe("Test summary");
      expect(result.source).toBe("llm");
    });

    it("should handle malformed JSON gracefully", async () => {
      mockCallLLMAPI.mockResolvedValue("{ invalid json }");

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.source).toBe("fallback");
    });

    it("should generate fallback with correct urgency for flagged tests", async () => {
      mockCallLLMAPI.mockRejectedValue(new Error("API failed"));

      // Test with 2+ flagged tests (should be HIGH)
      const inputWithFlags: ScanAnalysisInput = {
        extractedTests: [
          { name: "Test1", value: "10", flagged: true },
          { name: "Test2", value: "20", flagged: true },
        ],
      };

      const result = await analyzeScan(inputWithFlags);

      expect(result.success).toBe(true);
      expect(result.analysis?.urgency).toBe("HIGH");
    });

    it("should include patient context in analysis", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Age-appropriate analysis",
          urgency: "MODERATE",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan(validInput);

      expect(mockCallLLMAPI).toHaveBeenCalled();
      const callArgs = mockCallLLMAPI.mock.calls[0];
      expect(callArgs[0]).toContain("Age: 45");
      expect(callArgs[0]).toContain("Female");
    });

    it("should handle optional patient context", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const inputNoContext = {
        extractedTests: [{ name: "Test", value: "10" }],
      };

      const result = await analyzeScan(inputNoContext);

      expect(result.success).toBe(true);
      const callArgs = mockCallLLMAPI.mock.calls[0];
      // Should not error even without patient context
      expect(callArgs[0]).toBeDefined();
    });

    it("should include facility name when provided", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const inputWithFacility: ScanAnalysisInput = {
        extractedTests: [{ name: "Test", value: "10" }],
        facilityName: "St. Mary's Hospital",
      };

      await analyzeScan(inputWithFacility);

      const callArgs = mockCallLLMAPI.mock.calls[0];
      expect(callArgs[0]).toContain("St. Mary's Hospital");
    });

    it("should handle all urgency levels in fallback", async () => {
      mockCallLLMAPI.mockRejectedValue(new Error("API failed"));

      // Test LOW urgency
      const lowUrgency = await analyzeScan({
        extractedTests: [{ name: "Test", value: "10", flagged: false }],
      });
      expect(lowUrgency.analysis?.urgency).toBe("LOW");

      // Test MODERATE urgency
      const moderateUrgency = await analyzeScan({
        extractedTests: [{ name: "Test", value: "10", flagged: true }],
      });
      expect(moderateUrgency.analysis?.urgency).toBe("MODERATE");

      // Test HIGH urgency
      const highUrgency = await analyzeScan({
        extractedTests: [
          { name: "Test1", value: "10", flagged: true },
          { name: "Test2", value: "20", flagged: true },
        ],
      });
      expect(highUrgency.analysis?.urgency).toBe("HIGH");
    });

    it("should include timestamp in result", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan(validInput);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it("should limit recommendations to 3 items", async () => {
      const tooManyRecommendations = JSON.stringify({
        summary: "Test",
        urgency: "LOW",
        recommendations: ["Rec1", "Rec2", "Rec3", "Rec4", "Rec5"],
      });

      mockCallLLMAPI.mockResolvedValue(tooManyRecommendations);

      const result = await analyzeScan(validInput);

      expect(result.success).toBe(true);
      expect(result.source).toBe("fallback");
    });

    it("should handle single test result", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan({
        extractedTests: [{ name: "Hemoglobin", value: "14.2" }],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("analyzeScanBatch", () => {
    it("should process multiple inputs", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const inputs: ScanAnalysisInput[] = [
        {
          extractedTests: [{ name: "Test1", value: "10" }],
        },
        {
          extractedTests: [{ name: "Test2", value: "20" }],
        },
      ];

      const results = await analyzeScanBatch(inputs);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("should handle mixed success/failure in batch", async () => {
      mockCallLLMAPI.mockResolvedValueOnce(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      mockCallLLMAPI.mockRejectedValueOnce(new Error("API Error"));

      const inputs: ScanAnalysisInput[] = [
        {
          extractedTests: [{ name: "Test1", value: "10" }],
        },
        {
          extractedTests: [{ name: "Test2", value: "20" }],
        },
      ];

      const results = await analyzeScanBatch(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true); // Fallback should make it succeed
    });

    it("should handle empty batch", async () => {
      const results = await analyzeScanBatch([]);

      expect(results).toHaveLength(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in test names", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan({
        extractedTests: [
          {
            name: "Hemoglobin A1c (HbA1c) - Complex Test",
            value: "9.2",
          },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("should handle very high patient age", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan({
        extractedTests: [{ name: "Test", value: "10" }],
        patientAge: 150,
      });

      expect(result.success).toBe(true);
    });

    it("should handle numeric edge cases in test values", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const result = await analyzeScan({
        extractedTests: [
          { name: "Test1", value: "0.001" },
          { name: "Test2", value: "99999" },
          { name: "Test3", value: "-5.5" },
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("System Prompt", () => {
    it("should call LLM with correct system prompt format", async () => {
      mockCallLLMAPI.mockResolvedValue(
        JSON.stringify({
          summary: "Test",
          urgency: "LOW",
          recommendations: ["Test"],
        }),
      );

      const input: ScanAnalysisInput = {
        extractedTests: [{ name: "Test", value: "10" }],
      };

      await analyzeScan(input);

      expect(mockCallLLMAPI).toHaveBeenCalled();
      const [_, systemPrompt] = mockCallLLMAPI.mock.calls[0];

      expect(systemPrompt).toContain("clinical assistant");
      expect(systemPrompt).toContain("JSON");
      expect(systemPrompt).toContain("summary");
      expect(systemPrompt).toContain("urgency");
      expect(systemPrompt).toContain("recommendations");
    });
  });
});
