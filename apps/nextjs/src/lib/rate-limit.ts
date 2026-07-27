/**
 * Simple in-memory rate limiting middleware
 * Tracks requests per user/IP and enforces limits
 *
 * Note: For production with multiple instances, use Redis or similar
 */

type RateLimitStore = Record<string, { count: number; resetAt: number }>;

const store: RateLimitStore = {};

/**
 * Get rate limit key from request
 * Prioritizes authenticated user ID, falls back to IP address
 */
function _getRateLimitKey(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;

  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 * Returns { allowed, remaining, resetAt }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store[key];

  // Create or reset entry if window expired
  if (!entry || entry.resetAt < now) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: store[key].resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment counter
  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit response with headers
 */
export function rateLimitResponse(
  remaining: number,
  resetAt: number,
): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": resetAt.toString(),
        "Retry-After": retryAfter.toString(),
      },
    },
  );
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  auth: {
    signin: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes
    logout: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes
  },
  uploads: {
    sign: { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 per hour
    server: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    get: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
  },
};

/**
 * Cleanup old entries from store (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const key in store) {
    const entry = store[key];
    if (entry && entry.resetAt < now) {
      delete store[key];
      cleaned++;
    }
  }

  return cleaned;
}

// Cleanup every 10 minutes
setInterval(
  () => {
    const cleaned = cleanupRateLimitStore();
    if (cleaned > 0) {
      console.log(
        `Rate limit store cleanup: removed ${cleaned} expired entries`,
      );
    }
  },
  10 * 60 * 1000,
);
