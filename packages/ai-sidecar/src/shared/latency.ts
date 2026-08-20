/**
 * Latency optimizations for Gemini streaming: prompt compression, first-token timing, timeout tuning.
 */

export const RETRIEVER_TIMEOUT_MS = 5000;
export const MODEL_TIMEOUT_MS = 15000;
export const FIRST_TOKEN_BUDGET_MS = 1500;

export function compressPrompt(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  // Keep head and tail (preserve disclaimer + question at end)
  const head = text.slice(0, Math.floor(maxChars * 0.7));
  const tail = text.slice(-Math.floor(maxChars * 0.3));
  return `${head}\n...\n[compressed ${text.length - maxChars} chars]\n...\n${tail}`;
}

export function getRetrieverTimeout(): number {
  return parseInt(process.env.RETRIEVER_TIMEOUT_MS ?? String(RETRIEVER_TIMEOUT_MS), 10);
}

export function getModelTimeout(): number {
  return parseInt(process.env.MODEL_TIMEOUT ?? String(MODEL_TIMEOUT_MS), 10);
}

export function measureFirstToken<T>(
  startMs: number,
  onFirstToken?: (latencyMs: number) => void,
): (chunk: T) => T {
  let first = true;
  return (chunk: T) => {
    if (first) {
      first = false;
      const latency = Date.now() - startMs;
      if (latency > FIRST_TOKEN_BUDGET_MS) {
        console.warn(`[ai-sidecar] First token latency ${latency}ms exceeds ${FIRST_TOKEN_BUDGET_MS}ms budget`);
      }
      onFirstToken?.(latency);
    }
    return chunk;
  };
}
