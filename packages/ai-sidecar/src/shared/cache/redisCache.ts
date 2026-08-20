import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { gzipSync, gunzipSync } from "node:zlib";

import { tier1Cache } from "./lruCache.js";

/**
 * Tier 2: Distributed cache for cross-session deduplication.
 * Prefers Upstash Redis REST → ioredis → Supabase `klaro_cache` → memory fallback.
 * Serialization: JSON + gzip (threshold 1kb), base64.
 */

export interface DistributedCacheOptions {
  ttlMs?: number;
  compressionThreshold?: number;
}

type CacheValue = string;

let supabaseCacheClient: SupabaseClient | null = null;
function getSupabaseCacheClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabaseCacheClient) supabaseCacheClient = createClient(url, key);
  return supabaseCacheClient;
}

function serialize(value: string): string {
  const threshold = parseInt(process.env.CACHE_COMPRESSION_THRESHOLD ?? "1024", 10);
  if (value.length < threshold) return `raw:${value}`;
  const gz = gzipSync(Buffer.from(value, "utf8"));
  return `gz:${gz.toString("base64")}`;
}

function deserialize(stored: string): string {
  if (stored.startsWith("raw:")) return stored.slice(4);
  if (stored.startsWith("gz:")) {
    const buf = Buffer.from(stored.slice(3), "base64");
    return gunzipSync(buf).toString("utf8");
  }
  return stored;
}

// Tier-2 in-memory fallback when no distributed store is configured
const fallbackMemory = new Map<string, { value: string; expiresAt: number }>();

async function getFromUpstash(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function setToUpstash(key: string, value: string, ttlMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const ttlSec = Math.ceil(ttlMs / 1000);
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSec}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function getFromSupabase(key: string): Promise<string | null> {
  const client = getSupabaseCacheClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("klaro_cache")
      .select("value, expires_at")
      .eq("key", key)
      .single();
    if (error || !data) return null;
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
      await client.from("klaro_cache").delete().eq("key", key);
      return null;
    }
    return data.value as string;
  } catch {
    return null;
  }
}

async function setToSupabase(key: string, value: string, ttlMs: number): Promise<boolean> {
  const client = getSupabaseCacheClient();
  if (!client) return false;
  try {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const { error } = await client.from("klaro_cache").upsert({
      key,
      value,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export class DistributedCache {
  private readonly ttlMs: number;

  constructor(options?: DistributedCacheOptions) {
    this.ttlMs = options?.ttlMs ?? parseInt(process.env.CACHE_TTL_MS ?? "3600000", 10);
  }

  async get(key: string): Promise<string | null> {
    // 1. Tier-1 memory (fast path)
    const tier1 = tier1Cache.get(key);
    if (tier1) return tier1;

    // 2. Upstash REST
    const upstash = await getFromUpstash(key);
    if (upstash !== null) {
      const val = deserialize(upstash);
      tier1Cache.set(key, val);
      return val;
    }

    // 3. Supabase distributed table
    const supabaseVal = await getFromSupabase(key);
    if (supabaseVal !== null) {
      const val = deserialize(supabaseVal);
      tier1Cache.set(key, val);
      return val;
    }

    // 4. Fallback memory map (ephemeral)
    const fb = fallbackMemory.get(key);
    if (fb && fb.expiresAt > Date.now()) return deserialize(fb.value);
    if (fb) fallbackMemory.delete(key);
    return null;
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.ttlMs;
    const serialized = serialize(value);

    // Always populate tier-1
    tier1Cache.set(key, value, undefined, ttl);

    // Try distributed tiers (best-effort)
    const upstashOk = await setToUpstash(key, serialized, ttl);
    if (upstashOk) return;

    const supabaseOk = await setToSupabase(key, serialized, ttl);
    if (supabaseOk) return;

    // Fallback memory
    fallbackMemory.set(key, { value: serialized, expiresAt: Date.now() + ttl });
  }

  async delete(key: string): Promise<void> {
    tier1Cache.delete(key);
    fallbackMemory.delete(key);
    const client = getSupabaseCacheClient();
    if (client) await client.from("klaro_cache").delete().eq("key", key);
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      await fetch(`${url}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }

  async clear(): Promise<void> {
    tier1Cache.clear();
    fallbackMemory.clear();
    const client = getSupabaseCacheClient();
    if (client) await client.from("klaro_cache").delete().neq("key", "");
  }
}

export const distributedCache = new DistributedCache();

/**
 * SQL for Supabase `klaro_cache` table:
 *
 * CREATE TABLE IF NOT EXISTS klaro_cache (
 *   key text PRIMARY KEY,
 *   value text NOT NULL,
 *   expires_at timestamptz,
 *   updated_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS klaro_cache_expires_idx ON klaro_cache (expires_at);
 */
