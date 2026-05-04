import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";

import {
  chatMessage,
  analysis,
} from "@klaro/db/schema";

import { protectedProcedure } from "../trpc";

export const chatRouter = {
  /**
   * Send a chat message about a document analysis
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        analysisId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        dialect: z.enum(["Filipino", "Bisaya", "Ilocano"]).default("Filipino"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Verify analysis exists and belongs to user
      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      // Save user message
      await ctx.db.insert(chatMessage).values({
        analysisId: input.analysisId,
        userId: ctx.session.user.id,
        role: "user",
        content: input.content,
        dialect: input.dialect,
      });

      // TODO: Call LLM service to generate assistant response
      // For now, return placeholder response
      const assistantMessage = {
        role: "assistant",
        content: "This is a placeholder LLM response. Chat integration coming soon.",
        dialect: input.dialect,
      };

      // Save assistant message
      const [savedMessage] = await ctx.db.insert(chatMessage).values({
        analysisId: input.analysisId,
        userId: ctx.session.user.id,
        role: "assistant",
        content: assistantMessage.content,
        dialect: input.dialect,
      }).returning();

      return {
        userMessage: {
          role: "user",
          content: input.content,
          dialect: input.dialect,
        },
        assistantMessage,
      };
    }),

  /**
   * Get chat history for an analysis
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        analysisId: z.string().uuid(),
        limit: z.number().min(1).max(200).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Verify analysis exists and belongs to user
      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      const messages = await ctx.db
        .select()
        .from(chatMessage)
        .where(eq(chatMessage.analysisId, input.analysisId))
        .limit(input.limit)
        .orderBy(chatMessage.createdAt);

      return messages;
    }),

  /**
   * Clear chat history for an analysis
   */
  clearHistory: protectedProcedure
    .input(z.object({ analysisId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      // Verify analysis exists and belongs to user
      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      if (!doc_analysis || doc_analysis.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      // Delete all messages for this analysis
      await ctx.db
        .delete(chatMessage)
        .where(eq(chatMessage.analysisId, input.analysisId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
