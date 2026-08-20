import { distributedCache } from "./redisCache.js";
import { generateCacheKey, type CacheKeyInputs } from "./cacheKey.js";
import { emitCacheTelemetry, emitCostControlWithCache } from "./cacheTelemetry.js";

/**
 * Hybrid cache orchestrator: Tier1 LRU + Tier2 distributed (Redis/Supabase).
 * Provides stale-while-revalidate semantics for the retrieval_graph generate node.
 */

export interface CachedAnswer {
  answer: string;
  cachedAt: string;
  tier: "lru" | "redis" | "supabase" | "miss";
}

export async function getCachedAnswer(inputs: CacheKeyInputs): Promise<CachedAnswer | null> {
  const key = generateCacheKey(inputs);
  const start = Date.now();
  const raw = await distributedCache.get(key);
  const latency = Date.now() - start;

  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as CachedAnswer;
      const tier: CachedAnswer["tier"] = (parsed.tier as CachedAnswer["tier"]) ?? "lru";
      emitCacheTelemetry({
        cache_hit: true,
        cache_key: key,
        tenantId: inputs.tenantId ?? "public",
        latencyMs: latency,
        tier,
        locale: inputs.locale ?? "en",
      });
      emitCostControlWithCache({
        tenantId: inputs.tenantId ?? "public",
        cache_hit: true,
        savedTokens: 1500,
      });
      return parsed;
    } catch {
      return null;
    }
  }

  emitCacheTelemetry({
    cache_hit: false,
    cache_key: key,
    tenantId: inputs.tenantId ?? "public",
    latencyMs: latency,
    tier: "miss",
    locale: inputs.locale ?? "en",
  });
  emitCostControlWithCache({
    tenantId: inputs.tenantId ?? "public",
    cache_hit: false,
  });
  return null;
}

export async function setCachedAnswer(
  inputs: CacheKeyInputs,
  answer: string,
  ttlMs?: number,
): Promise<void> {
  const key = generateCacheKey(inputs);
  const payload: CachedAnswer = {
    answer,
    cachedAt: new Date().toISOString(),
    tier: "lru",
  };
  await distributedCache.set(key, JSON.stringify(payload), ttlMs);
}

export async function getOrSetCachedAnswer(
  inputs: CacheKeyInputs,
  fetcher: () => Promise<string>,
  ttlMs?: number,
): Promise<{ answer: string; fromCache: boolean }> {
  if (process.env.CACHE_ENABLED === "false") {
    const answer = await fetcher();
    return { answer, fromCache: false };
  }

  const cached = await getCachedAnswer(inputs);
  if (cached) {
    // Stale-while-revalidate: if stale (>50% TTL), refresh in background
    const ttl = ttlMs ?? parseInt(process.env.CACHE_TTL_MS ?? "3600000", 10);
    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age > ttl * 0.5) {
      // Background revalidation without awaiting
      fetcher()
        .then((fresh) => setCachedAnswer(inputs, fresh, ttlMs))
        .catch(() => {});
    }
    return { answer: cached.answer, fromCache: true };
  }

  const answer = await fetcher();
  await setCachedAnswer(inputs, answer, ttlMs);
  return { answer, fromCache: false };
}
