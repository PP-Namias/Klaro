import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "./auth.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 15;
const MAX_TRACKED_IDENTIFIERS = 10_000;
const SWEEP_INTERVAL_MS = 60 * 1000;

const limits = new Map<string, RateLimitEntry>();
let lastSweepAt = Date.now();

function windowMs(): number {
  const raw = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_WINDOW_MS;
}

function maxRequests(): number {
  const raw = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_REQUESTS;
}

function sweepIfDue(now: number): void {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, record] of limits) {
    if (now > record.resetAt) {
      limits.delete(key);
    }
  }
  while (limits.size > MAX_TRACKED_IDENTIFIERS) {
    const oldest = limits.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    limits.delete(oldest);
  }
}

export function rateLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const now = Date.now();
  sweepIfDue(now);

  const tenantId = req.user?.tenantId;
  const identifier =
    tenantId && tenantId !== "public"
      ? `tenant:${tenantId}`
      : `ip:${req.ip ?? req.socket.remoteAddress ?? "guest_unknown"}`;

  const window = windowMs();
  const max = maxRequests();

  const record = limits.get(identifier);
  if (!record || now > record.resetAt) {
    limits.set(identifier, { count: 1, resetAt: now + window });
    next();
    return;
  }

  if (record.count >= max) {
    res.status(429).json({
      error: "Rate limit exceeded. Please wait before sending more messages.",
      resetAt: record.resetAt,
    });
    return;
  }

  record.count += 1;
  next();
}

export function resetRateLimitStore(): void {
  limits.clear();
}
