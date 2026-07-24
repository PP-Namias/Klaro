import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";

export interface SessionSecurityInfo {
  user: NonNullable<NonNullable<TRPCContext["session"]>>["user"];
  ipAddress: string | null;
  userAgent: string | null;
}

export const requireAuth = (ctx: TRPCContext): SessionSecurityInfo => {
  const user = ctx?.session?.user;
  if (!user || !user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be authenticated to access this resource",
    });
  }

  if (ctx.session?.session?.expiresAt) {
    const expiresAt = new Date(ctx.session.session.expiresAt);
    if (expiresAt < new Date()) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Session has expired. Please sign in again.",
      });
    }
  }

  return {
    user,
    ipAddress: ctx.ipAddress || null,
    userAgent: ctx.userAgent || null,
  };
};

export default requireAuth;
