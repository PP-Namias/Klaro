/**
 * Tier 1: In-Memory LRU Cache for ultra-low latency prompt deduplication.
 * Per-tenant isolated, TTL-aware, max-size bounded.
 */

export interface LruCacheOptions {
  maxSize?: number;
  ttlMs?: number;
  tenantIsolation?: boolean;
}

export interface CacheEntry<V> {
  value: V;
  expiresAt: number;
  tenantId?: string;
}

export class LruCache<V = string> {
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly tenantIsolation: boolean;
  private readonly store = new Map<string, CacheEntry<V>>();

  constructor(options?: LruCacheOptions) {
    this.maxSize = options?.maxSize ?? parseInt(process.env.CACHE_MAX_SIZE ?? "500", 10);
    this.ttlMs = options?.ttlMs ?? parseInt(process.env.CACHE_TTL_MS ?? "3600000", 10);
    this.tenantIsolation = options?.tenantIsolation ?? true;
  }

  private keyWithTenant(key: string, tenantId?: string): string {
    if (!this.tenantIsolation || !tenantId) return key;
    return `${tenantId}:${key}`;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictIfNeeded(): void {
    if (this.store.size < this.maxSize) return;
    const oldest = this.store.keys().next().value as string | undefined;
    if (oldest) this.store.delete(oldest);
  }

  get(key: string, tenantId?: string): V | undefined {
    const k = this.keyWithTenant(key, tenantId);
    const entry = this.store.get(k);
    if (!entry) return undefined;
    if (this.isExpired(entry)) {
      this.store.delete(k);
      return undefined;
    }
    // LRU promotion
    this.store.delete(k);
    this.store.set(k, entry);
    return entry.value;
  }

  set(key: string, value: V, tenantId?: string, ttlMs?: number): void {
    const k = this.keyWithTenant(key, tenantId);
    const expiresAt = Date.now() + (ttlMs ?? this.ttlMs);
    if (this.store.has(k)) this.store.delete(k);
    else this.evictIfNeeded();
    this.store.set(k, { value, expiresAt, tenantId });
  }

  has(key: string, tenantId?: string): boolean {
    return this.get(key, tenantId) !== undefined;
  }

  delete(key: string, tenantId?: string): boolean {
    return this.store.delete(this.keyWithTenant(key, tenantId));
  }

  clear(tenantId?: string): void {
    if (!tenantId || !this.tenantIsolation) {
      this.store.clear();
      return;
    }
    for (const k of [...this.store.keys()]) {
      if (k.startsWith(`${tenantId}:`)) this.store.delete(k);
    }
  }

  size(tenantId?: string): number {
    if (!tenantId) return this.store.size;
    let n = 0;
    for (const k of this.store.keys()) if (k.startsWith(`${tenantId}:`)) n++;
    return n;
  }

  sweepExpired(): number {
    let removed = 0;
    for (const [k, v] of [...this.store.entries()]) {
      if (this.isExpired(v)) {
        this.store.delete(k);
        removed++;
      }
    }
    return removed;
  }
}

// Singleton tier-1 cache for prompt embeddings and answers
export const tier1Cache = new LruCache<string>();

// Separate tier for embeddings (larger)
export const embeddingCache = new LruCache<number[]>({
  maxSize: parseInt(process.env.EMBEDDING_CACHE_SIZE ?? "1000", 10),
  ttlMs: parseInt(process.env.EMBEDDING_CACHE_TTL_MS ?? "3600000", 10),
});
