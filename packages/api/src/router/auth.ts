import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { consentRecord } from "@klaro/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

/**
 * Version of the Terms of Service / Terms & Conditions / medical disclaimer
 * that the consent gate presents. Bump this when the wording changes so that
 * existing acceptances can be distinguished from re-consent.
 */
export const CURRENT_TERMS_VERSION = "2024-06-ra10173";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),

  /**
   * Record that the user accepted the consent gate before any document is read.
   *
   * Public because guests scan without an account. Stores no medical content —
   * only proof that consent was given (RA 10173).
   */
  recordConsent: publicProcedure
    .input(
      z.object({
        sessionId: z.string().trim().min(1).max(128).optional(),
        termsVersion: z
          .string()
          .trim()
          .min(1)
          .max(32)
          .default(CURRENT_TERMS_VERSION),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(consentRecord)
        .values({
          userId: ctx.session?.user?.id ?? null,
          sessionId: input.sessionId ?? ctx.traceId,
          termsVersion: input.termsVersion,
          // Take only the first hop; the header can carry a proxy chain.
          ipAddress: ctx.ipAddress?.split(",")[0]?.trim() ?? null,
          userAgent: ctx.userAgent,
        })
        .returning({
          id: consentRecord.id,
          acceptedAt: consentRecord.acceptedAt,
        });

      return {
        consentId: row?.id ?? null,
        acceptedAt: row?.acceptedAt ?? null,
        termsVersion: input.termsVersion,
      };
    }),
} satisfies TRPCRouterRecord;
