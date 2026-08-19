import { afterEach, describe, expect, it, vi } from "vitest";

import type { TokenUsage } from "../costTracking.js";
import { createCostTracker, extractTokenUsage } from "../costTracking.js";

describe("extractTokenUsage", () => {
  it("extracts LangChain OpenAI-style tokenUsage", () => {
    const usage = extractTokenUsage({
      llmOutput: {
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    } as never);
    expect(usage).toEqual({
      totalTokens: 15,
      promptTokens: 10,
      completionTokens: 5,
    });
  });

  it("extracts Anthropic-style estimatedTokenUsage", () => {
    const usage = extractTokenUsage({
      llmOutput: {
        estimatedTokenUsage: { promptTokens: 20, completionTokens: 7 },
      },
    } as never);
    expect(usage).toEqual({
      totalTokens: 27,
      promptTokens: 20,
      completionTokens: 7,
    });
  });

  it("extracts provider-native snake_case usage from llmOutput", () => {
    const usage = extractTokenUsage({
      llmOutput: {
        tokenUsage: {
          prompt_tokens: 12,
          completion_tokens: 8,
          total_tokens: 20,
        },
      },
    } as never);
    expect(usage).toEqual({
      totalTokens: 20,
      promptTokens: 12,
      completionTokens: 8,
    });
  });

  it("extracts message-level usage", () => {
    const usage = extractTokenUsage({
      generations: [
        [
          {
            message: {
              usage: { input_tokens: 30, output_tokens: 4, total_tokens: 34 },
            },
          },
        ],
      ],
    } as never);
    expect(usage).toEqual({
      totalTokens: 34,
      promptTokens: 30,
      completionTokens: 4,
    });
  });

  it("returns undefined when no usage is present", () => {
    const usage = extractTokenUsage({ generations: [[]] } as never);
    expect(usage).toBeUndefined();
  });

  it("returns undefined for empty output", () => {
    expect(extractTokenUsage(undefined as never)).toBeUndefined();
  });
});

describe("createCostTracker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits a cost_control_metric line with the tenant and token totals", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const tracker = createCostTracker("tenant-a");

    tracker.callbacks[0].handleLLMEnd({
      llmOutput: {
        tokenUsage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    } as never);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0] as string;
    const metric = JSON.parse(line) as Record<string, unknown>;
    expect(metric).toEqual({
      event: "cost_control_metric",
      tenantId: "tenant-a",
      totalTokens: 15,
      promptTokens: 10,
      completionTokens: 5,
    });
  });

  it("does not emit when the LLM result carries no usage", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const tracker = createCostTracker("tenant-a");

    tracker.callbacks[0].handleLLMEnd({ generations: [[]] } as never);

    expect(logSpy).not.toHaveBeenCalled();
  });
});
