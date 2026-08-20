import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const GEMINI_MODEL_HIERARCHY = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-3.6-flash",
] as const;

export type GeminiModel = (typeof GEMINI_MODEL_HIERARCHY)[number];

const MODEL_ALIASES: Record<string, GeminiModel> = {
  "gemini-2.0-flash": "gemini-3.6-flash",
  "gemini-2.0-pro": "gemini-2.5-pro",
  "gemini": "gemini-2.5-flash",
  "gemini-flash": "gemini-2.5-flash",
  "gemini-pro": "gemini-2.5-pro",
};

export function resolveGeminiModel(input?: string): GeminiModel {
  const raw = (input ?? process.env.GEMINI_MODEL ?? process.env.CHAT_MODEL ?? "gemini-2.5-flash").trim();
  // strip provider prefix if present (google-genai/..., gemini/...)
  const bare = raw.includes("/") ? (raw.split("/").pop() ?? raw) : raw;
  const aliased = MODEL_ALIASES[bare] ?? (bare as GeminiModel);
  if ((GEMINI_MODEL_HIERARCHY as readonly string[]).includes(aliased)) return aliased as GeminiModel;
  return "gemini-2.5-flash";
}

export function getGeminiFallbackChain(primary: GeminiModel): GeminiModel[] {
  const idx = GEMINI_MODEL_HIERARCHY.indexOf(primary);
  if (idx === -1) return [...GEMINI_MODEL_HIERARCHY];
  return GEMINI_MODEL_HIERARCHY.slice(idx + 1) as GeminiModel[];
}

function resolveGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    undefined
  );
}

function buildGeminiArgs(model: GeminiModel, temperature: number): Record<string, unknown> {
  return {
    model,
    temperature,
    timeout: parseInt(process.env.MODEL_TIMEOUT ?? "25000", 10),
    maxRetries: parseInt(process.env.MODEL_MAX_RETRIES ?? "3", 10),
    apiKey: resolveGeminiApiKey(),
  };
}

export function isGeminiRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return m.includes("429") || m.includes("rate limit") || m.includes("quota") || m.includes("resource_exhausted");
  }
  return false;
}

/**
 * Instantiate a Gemini model. Single point for Gemini native pathing.
 */
export async function createGeminiModel(
  model: GeminiModel,
  temperature = 0.2,
): Promise<BaseChatModel> {
  return new ChatGoogleGenerativeAI(buildGeminiArgs(model, temperature) as never);
}

/**
 * Router with version fallback across the Gemini hierarchy.
 * Tries primary, then each fallback on rate-limit / quota errors.
 */
export async function loadGeminiModel(
  spec?: string,
  temperature = 0.2,
): Promise<BaseChatModel> {
  const primary = resolveGeminiModel(spec);
  const chain: GeminiModel[] = [primary, ...getGeminiFallbackChain(primary)];

  let lastErr: unknown;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i]!;
    try {
      return await createGeminiModel(model, temperature);
    } catch (err) {
      lastErr = err;
      const isRate = isGeminiRateLimitError(err);
      const isLast = i === chain.length - 1;
      if (!isRate || isLast) throw err;
      console.warn(`[ai-sidecar] Gemini model "${model}" rate-limited, falling back to "${chain[i + 1]}"`);
    }
  }
  throw lastErr;
}

/**
 * Execute a Gemini call with automatic model-version fallback on rate-limit.
 */
export async function withGeminiFallback<T>(
  primary: GeminiModel,
  fn: (model: GeminiModel) => Promise<T>,
): Promise<T> {
  const chain: GeminiModel[] = [primary, ...getGeminiFallbackChain(primary)];
  let lastErr: unknown;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i]!;
    try {
      return await fn(model);
    } catch (err) {
      lastErr = err;
      const isRate = isGeminiRateLimitError(err);
      const isLast = i === chain.length - 1;
      if (!isRate || isLast) throw err;
      console.warn(`[ai-sidecar] Gemini call on "${model}" rate-limited, retrying with "${chain[i + 1]}"`);
    }
  }
  throw lastErr;
}
