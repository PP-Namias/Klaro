import type { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const GEMINI_EMBEDDING_MODEL = "text-embedding-004";
export const GEMINI_EMBEDDING_DIMS = 768;

/**
 * Resolve the Gemini API key from the supported env aliases.
 */
export function resolveGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    undefined
  );
}

/**
 * Whether embeddings should use the deterministic mock (no network).
 * Activated when no API key is present or EMBEDDING_PROVIDER=mock or VECTOR_STORE_PROVIDER=none
 */
export function shouldUseMockEmbeddings(): boolean {
  if (process.env.EMBEDDING_PROVIDER === "mock") return true;
  if (process.env.VECTOR_STORE_PROVIDER === "none") return true;
  if (process.env.ENABLE_MOCK_MODE === "true") return true;
  return !resolveGeminiApiKey();
}

/**
 * Deterministic pseudo-embedding for offline/tests.
 * Produces a 768-d normalized vector from a string hash.
 */
export function mockEmbed(text: string, dims = GEMINI_EMBEDDING_DIMS): number[] {
  const vec = new Array<number>(dims).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < dims; i++) {
    // xorshift-like deterministic
    const v = Math.sin(hash + i * 0.7) * 10000;
    vec[i] = v - Math.floor(v) - 0.5;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? vec : vec.map((x) => x / norm);
}

export function getGeminiEmbeddings(model?: string): Embeddings {
  if (shouldUseMockEmbeddings()) {
    return {
      embedDocuments: async (texts: string[]) => texts.map((t) => mockEmbed(t)),
      embedQuery: async (text: string) => mockEmbed(text),
    } as unknown as Embeddings;
  }

  const apiKey = resolveGeminiApiKey();
  return new GoogleGenerativeAIEmbeddings({
    model: model ?? process.env.EMBEDDING_MODEL ?? GEMINI_EMBEDDING_MODEL,
    apiKey,
  });
}

/**
 * Backwards-compatible alias used by retrieval.ts.
 * Prefer getGeminiEmbeddings for new code.
 */
export function getEmbeddings(model?: string): Embeddings {
  return getGeminiEmbeddings(model);
}

/**
 * Batch embedding with simple retry and backoff.
 */
export async function embedTexts(
  texts: string[],
  opts?: { batchSize?: number; maxRetries?: number; model?: string },
): Promise<number[][]> {
  const batchSize = opts?.batchSize ?? parseInt(process.env.EMBEDDING_BATCH_SIZE ?? "32", 10);
  const maxRetries = opts?.maxRetries ?? parseInt(process.env.EMBEDDING_MAX_RETRIES ?? "3", 10);
  const embeddings = getGeminiEmbeddings(opts?.model);

  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    let attempt = 0;
    while (true) {
      try {
        const vecs = await embeddings.embedDocuments(batch);
        results.push(...vecs);
        break;
      } catch (err) {
        attempt++;
        if (attempt > maxRetries) throw err;
        const backoff = 200 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  return results;
}

export async function embedQuery(
  text: string,
  model?: string,
): Promise<number[]> {
  const embeddings = getGeminiEmbeddings(model);
  return embeddings.embedQuery(text);
}
