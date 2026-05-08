import { TRPCError } from "@trpc/server";

import type { TRPCContext } from "../trpc";

export const requireAuth = (ctx: TRPCContext) => {
  const user = ctx?.session?.user;
  if (!user || !user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be authenticated to access this resource",
    });
  }
  return user;
};

export default requireAuth;
