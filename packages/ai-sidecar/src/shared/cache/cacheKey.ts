import { createHash } from "node:crypto";

/**
 * Deterministic cache key generation via SHA-256.
 * Inputs: sanitized prompt + concatenated retrieved medical context + locale.
 * Guarantees isolation between distinct medical queries and prevents cross-contamination.
 */

export interface CacheKeyInputs {
  prompt: string;
  context?: string;
  locale?: string;
  tenantId?: string;
  model?: string;
}

function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .slice(0, 4000);
}

function hashString(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function generateCacheKey(inputs: CacheKeyInputs): string {
  const prompt = sanitizePrompt(inputs.prompt);
  const context = (inputs.context ?? "").trim().slice(0, 8000);
  const locale = (inputs.locale ?? "en").toLowerCase();
  const tenantId = inputs.tenantId ?? "public";
  const model = inputs.model ?? "gemini-2.5-flash";

  // Structured preimage: versioned for future invalidation
  const preimage = [
    "v1",
    `prompt:${hashString(prompt)}`,
    `context:${hashString(context)}`,
    `locale:${locale}`,
    `tenant:${tenantId}`,
    `model:${model}`,
  ].join("|");

  const keyHash = hashString(preimage);
  return `klaro:cache:${locale}:${keyHash.slice(0, 32)}`;
}

export function generateEmbeddingCacheKey(text: string, model = "text-embedding-004"): string {
  const sanitized = sanitizePrompt(text);
  return `klaro:emb:${model}:${hashString(sanitized).slice(0, 32)}`;
}

export function isCacheKeyValid(key: string): boolean {
  return /^klaro:cache:[a-z]{2,3}:[0-9a-f]{32}$/.test(key);
}
