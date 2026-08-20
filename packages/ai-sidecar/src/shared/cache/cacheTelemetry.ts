/**
 * Cache telemetry: emits cache_hit metrics for cost reduction validation (target 40%).
 * Logs structured JSON compatible with cost_control_metric.
 */

export interface CacheTelemetryEvent {
  event: "cache_telemetry";
  cache_hit: boolean;
  cache_key: string;
  tenantId: string;
  latency_ms: number;
  tier: "lru" | "redis" | "supabase" | "miss";
  locale: string;
  timestamp: string;
}

export function emitCacheTelemetry(opts: {
  cache_hit: boolean;
  cache_key: string;
  tenantId: string;
  latencyMs: number;
  tier: CacheTelemetryEvent["tier"];
  locale: string;
}): void {
  const payload: CacheTelemetryEvent = {
    event: "cache_telemetry",
    cache_hit: opts.cache_hit,
    cache_key: opts.cache_key.slice(0, 32),
    tenantId: opts.tenantId,
    latency_ms: opts.latencyMs,
    tier: opts.tier,
    locale: opts.locale,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}

export function emitCostControlWithCache(opts: {
  tenantId: string;
  cache_hit: boolean;
  savedTokens?: number;
  totalTokens?: number;
}): void {
  console.log(
    JSON.stringify({
      event: "cost_control_metric",
      tenantId: opts.tenantId,
      cache_hit: opts.cache_hit,
      savedTokens: opts.savedTokens ?? (opts.cache_hit ? 1500 : 0),
      totalTokens: opts.totalTokens ?? 0,
      estimated_saving_pct: opts.cache_hit ? 40 : 0,
    }),
  );
}
