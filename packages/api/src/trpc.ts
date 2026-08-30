/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */
import { randomUUID } from "node:crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { Auth } from "@klaro/auth";
import type { Language } from "@klaro/validators/language";
import { db } from "@klaro/db/client";

import { checkRateLimit } from "./middleware/rateLimiter";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
}) => {
  const authApi = opts.auth.api;
  const traceId = randomUUID();
  const session = await authApi.getSession({
    headers: opts.headers,
  });

  const rawLang = opts.headers.get("x-klaro-language");
  const language: Language =
    rawLang && ["en", "fil", "ceb", "ilo"].includes(rawLang)
      ? (rawLang as Language)
      : "fil";

  const ipAddress =
    opts.headers.get("x-forwarded-for") ||
    opts.headers.get("x-real-ip") ||
    null;
  const userAgent = opts.headers.get("user-agent") || null;

  return {
    authApi,
    session,
    db,
    traceId,
    language,
    ipAddress,
    userAgent,
  };
};

// Export the inferred context type for use in other modules
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error, ctx }) => ({
    ...shape,
    data: {
      ...shape.data,
      traceId: ctx?.traceId ?? null,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Server-side caller factory. Lets tests (and server-side callers) invoke
 * procedures directly without going over HTTP.
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware);

/**
 * Rate-limited procedures for chat and scan endpoints
 * Limits: 30 requests/min for chat, 10 requests/min for scan
 */
export const chatProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware)
  .use(({ ctx, next }) => {
    const userId = ctx.session?.user?.id || "anon";
    const result = checkRateLimit(`chat:${userId}`, 30);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Chat rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)}s.`,
      });
    }
    return next();
  });

export const scanProcedure = t.procedure
  .use(timingMiddleware)
  .use(authMiddleware)
  .use(({ ctx, next }) => {
    const userId = ctx.session?.user?.id || "anon";
    const result = checkRateLimit(`scan:${userId}`, 10);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Scan rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)}s.`,
      });
    }
    return next();
  });
