import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

import {
  createGeminiModel,
  isGeminiRateLimitError,
  loadGeminiModel,
  resolveGeminiModel,
} from "./geminiRouter.js";

/**
 * Gemini-exclusive model resolution.
 * Single source of truth: GEMINI_MODEL > CHAT_MODEL > bare gemini.
 * All specs resolve to a Gemini model; non-Gemini prefixes are stripped.
 */
export function resolveModelSpec(override?: string): string {
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- empty strings mean "unset" here */
  const raw =
    override ||
    process.env.GEMINI_MODEL ||
    process.env.CHAT_MODEL ||
    process.env.LLM_PROVIDER ||
    "gemini-2.5-flash";
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
  // Normalize to Gemini: strip provider prefix if any
  const bare = raw.includes("/") ? (raw.split("/").pop() ?? raw) : raw;
  return resolveGeminiModel(bare);
}

export async function loadChatModel(
  spec: string,
  temperature = 0.2,
): Promise<BaseChatModel> {
  const fallbackSpec = process.env.GEMINI_MODEL_FALLBACK || process.env.CHAT_MODEL_FALLBACK;

  try {
    // Delegates to Gemini router with version fallback chain
    return await loadGeminiModel(spec, temperature);
  } catch (primaryErr) {
    if (fallbackSpec && isGeminiRateLimitError(primaryErr)) {
      console.warn(`[ai-sidecar] Primary Gemini model "${spec}" rate-limited, falling back to "${fallbackSpec}"`);
      try {
        // Direct model creation for explicit fallback
        return await createGeminiModel(resolveGeminiModel(fallbackSpec), temperature);
      } catch (fallbackErr) {
        console.error(`[ai-sidecar] Fallback Gemini model "${fallbackSpec}" also failed`);
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

export function isRateLimitError(err: unknown): boolean {
  return isGeminiRateLimitError(err);
}
