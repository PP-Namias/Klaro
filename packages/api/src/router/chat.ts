import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";

import {
  chatMessage,
  analysis,
} from "@klaro/db/schema";

import { protectedProcedure } from "../trpc";
import { assembleDocumentContext } from "../services/contextAssembler";
import { callLLMAPI } from "../services/llm";

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

      // Fetch recent messages for context (last 5)
      const recent = await ctx.db
        .select()
        .from(chatMessage)
        .where(eq(chatMessage.analysisId, input.analysisId))
        .orderBy(chatMessage.createdAt)
        .limit(5);

      const recentMessages = recent.map((m) => ({
        role: m.role,
        content: m.content,
        dialect: m.dialect,
      }));

      // Assemble context from analysis + recent messages
      const context = assembleDocumentContext(
        {
          extractedFields: doc_analysis.extractedFields as Record<
            string,
            unknown
          > | null,
          plainLanguageSummary: doc_analysis.plainLanguageSummary,
        },
        recentMessages,
      );

      const systemPrompt = `You are a helpful health assistant. Keep responses brief, supportive, and ask one follow-up question when appropriate.`;
      const prompt = `Context:\n${context}\n\nUser message:\n${input.content}\n\nRespond briefly and include one follow-up question.`;

      // Call LLM (falls back to empty string if API key not configured)
      let llmOutput = "";
      try {
        llmOutput = await callLLMAPI(prompt, systemPrompt);
      } catch (err) {
        console.error("LLM call failed:", err);
        llmOutput = "";
      }

      // Fallback if LLM not configured
      const assistantContent = llmOutput || `${doc_analysis.plainLanguageSummary || "I reviewed your results."}\n\nFollow-up: Can you tell me if you have any new symptoms or concerns?`;

      const assistantMessage = {
        role: "assistant",
        content: assistantContent,
        dialect: input.dialect,
      };

      // Save assistant message
      await ctx.db.insert(chatMessage).values({
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
