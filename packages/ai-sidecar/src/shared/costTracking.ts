import type { LLMResult } from "@langchain/core/outputs";

export interface TokenUsage {
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

function pickUsage(
  source: Record<string, unknown> | undefined,
): TokenUsage | undefined {
  if (!source) return undefined;

  const num = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

  const total = num(
    source.totalTokens ?? source.total_tokens ?? source.totalTokensUsed,
  );
  const prompt = num(
    source.promptTokens ??
      source.prompt_tokens ??
      source.input_tokens ??
      source.input,
  );
  const completion = num(
    source.completionTokens ??
      source.completion_tokens ??
      source.output_tokens ??
      source.output,
  );

  if (total === undefined && prompt === undefined && completion === undefined) {
    return undefined;
  }

  return {
    totalTokens: total ?? (prompt ?? 0) + (completion ?? 0),
    promptTokens: prompt,
    completionTokens: completion,
  };
}

export function extractTokenUsage(output: LLMResult): TokenUsage | undefined {
  const llmOutput = output?.llmOutput as Record<string, unknown> | undefined;
  const source = (llmOutput?.tokenUsage ??
    llmOutput?.estimatedTokenUsage ??
    llmOutput?.usage_metadata) as Record<string, unknown> | undefined;

  const generation = output?.generations?.[0]?.[0] as
    | { message?: Record<string, unknown> }
    | undefined;
  const messageSource = (generation?.message?.usage ??
    generation?.message?.usage_metadata) as Record<string, unknown> | undefined;

  return pickUsage(source) ?? pickUsage(messageSource);
}

export function createCostTracker(tenantId: string): {
  callbacks: {
    handleLLMEnd: (output: LLMResult) => void;
  }[];
} {
  return {
    callbacks: [
      {
        handleLLMEnd(output: LLMResult) {
          const usage = extractTokenUsage(output);
          if (!usage) return;
          console.log(
            JSON.stringify({
              event: "cost_control_metric",
              tenantId,
              totalTokens: usage.totalTokens ?? 0,
              promptTokens: usage.promptTokens ?? 0,
              completionTokens: usage.completionTokens ?? 0,
            }),
          );
        },
      },
    ],
  };
}
