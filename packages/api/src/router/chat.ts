import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { analysis, chatMessage } from "@klaro/db/schema";
import { DialectEnum } from "@klaro/validators/llm";

import { logChatMessage, logLlmApiCall } from "../services/auditLogger";
import { assembleDocumentContext } from "../services/contextAssembler";
import { callLLMAPI } from "../services/llm";
import {
  buildBlockedResponse,
  checkInputGuardrails,
  filterOutput,
} from "../services/medicalGuardrails";
import { detectPhiTypes, scrubPhi } from "../services/phiScrubber";
import { chatProcedure as protectedProcedure } from "../trpc";

export type ChatSeverity = "LOW" | "MODERATE" | "HIGH";

export interface ChatSafety {
  severity: ChatSeverity;
  disclaimer?: string;
  bookingSuggestion?: string;
  suggestedActions: string[];
}

const getChatSeverity = (docAnalysis: {
  tanqmoCard?: unknown;
  flaggedValues?: unknown;
}): ChatSeverity => {
  const tanqmoCard = docAnalysis.tanqmoCard;

  if (
    tanqmoCard &&
    typeof tanqmoCard === "object" &&
    "severity" in tanqmoCard &&
    typeof tanqmoCard.severity === "string"
  ) {
    const severity = tanqmoCard.severity.toUpperCase();
    if (severity === "HIGH" || severity === "MODERATE" || severity === "LOW") {
      return severity;
    }
  }

  if (
    Array.isArray(docAnalysis.flaggedValues) &&
    docAnalysis.flaggedValues.length > 0
  ) {
    return docAnalysis.flaggedValues.length >= 2 ? "HIGH" : "MODERATE";
  }

  return "LOW";
};

const buildChatSafety = (docAnalysis: {
  tanqmoCard?: unknown;
  flaggedValues?: unknown;
}): ChatSafety => {
  const severity = getChatSeverity(docAnalysis);

  if (severity === "HIGH") {
    return {
      severity,
      disclaimer:
        "⚠️ Ang ilang resulta ay hindi normal. Mag-book ng appointment sa doktor sa lalong madaling panahon.",
      bookingSuggestion: "📞 Mag-book ng appointment sa doktor ngayon",
      suggestedActions: ["bookAppointment"],
    };
  }

  if (severity === "MODERATE") {
    return {
      severity,
      disclaimer:
        "May ilang resulta na lumalabas sa normal na saklaw. Mas mabuting magpatingin sa doktor.",
      suggestedActions: ["scheduleCheckup"],
    };
  }

  return {
    severity,
    suggestedActions: ["continueChat"],
  };
};

export const chatRouter = {
  /**
   * Send a chat message about a document analysis
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        analysisId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        dialect: DialectEnum.default("Filipino"),
      }),
    )
    .use(async ({ ctx, input, next }) => {
      const [docAnalysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.id, input.analysisId));

      const userId = ctx.session?.user?.id;
      if (docAnalysis?.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this analysis",
        });
      }

      return next({
        ctx: {
          ...ctx,
          chatSafety: buildChatSafety(docAnalysis),
          chatAnalysis: docAnalysis,
        },
      });
    })
    .mutation(async ({ ctx, input }) => {
      const docAnalysis = ctx.chatAnalysis as {
        extractedFields?: Record<string, unknown> | null;
        plainLanguageSummary?: string | null;
      };

      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }
      const userId = ctx.session.user.id;

      // AI-06: Medical Context Guardrails - Check input for blocked patterns
      const inputGuardrail = checkInputGuardrails(input.content);
      if (inputGuardrail.level === "blocked") {
        // Log the blocked request for audit
        logChatMessage({
          userId,
          analysisId: input.analysisId,
          phiDetected: false,
          phiTypes: [],
        }).catch(() => {});

        // Save user message (for record-keeping)
        await ctx.db.insert(chatMessage).values({
          analysisId: input.analysisId,
          userId,
          role: "user",
          content: input.content,
          dialect: input.dialect,
        });

        // Return blocked response
        const blockedResponse = buildBlockedResponse(
          input.content,
          input.dialect,
        );

        const assistantMessage = {
          role: "assistant",
          content: blockedResponse,
          dialect: input.dialect,
        };

        await ctx.db
          .insert(chatMessage)
          .values({
            analysisId: input.analysisId,
            userId,
            role: "assistant",
            content: blockedResponse,
            dialect: input.dialect,
          })
          .returning();

        return {
          userMessage: {
            role: "user",
            content: input.content,
            dialect: input.dialect,
          },
          assistantMessage,
          suggestedActions: [],
          safety: {
            severity: "HIGH" as const,
            disclaimer: inputGuardrail.reason,
            suggestedActions: ["consultDoctor"],
          },
          guardrailBlocked: true,
        };
      }

      // PHI Detection: Check user message for PHI before processing
      const userPhiTypes = detectPhiTypes(input.content);
      if (userPhiTypes.length > 0) {
        logChatMessage({
          userId,
          analysisId: input.analysisId,
          phiDetected: true,
          phiTypes: userPhiTypes,
        }).catch(() => {});
      }

      // Save user message (original, for record-keeping)
      await ctx.db.insert(chatMessage).values({
        analysisId: input.analysisId,
        userId,
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
        dialect: m.dialect ?? undefined,
      }));

      // Assemble context from analysis + recent messages
      const context = assembleDocumentContext(
        {
          extractedFields: docAnalysis.extractedFields as Record<
            string,
            unknown
          > | null,
          plainLanguageSummary: docAnalysis.plainLanguageSummary,
        },
        recentMessages,
      );

      // PHI Scrubbing: Redact patient data from context before sending to LLM
      const scrubbedContext = scrubPhi(context);
      if (scrubbedContext.matchCount > 0) {
        console.log(
          JSON.stringify({
            type: "phi_scrubbed",
            context: "chat_message",
            phiCount: scrubbedContext.matchCount,
            phiTypes: detectPhiTypes(context),
            timestamp: new Date().toISOString(),
          }),
        );
      }

      const systemPrompt = `You are a helpful health assistant. Keep responses brief, supportive, and ask one follow-up question when appropriate. If safety guidance is present, include it before any other advice. IMPORTANT: Respond in the patient's preferred language: ${input.dialect}. NEVER provide medical diagnosis or treatment recommendations. Always recommend consulting a healthcare professional.`;
      const safetyPrefix =
        ctx.chatSafety?.severity === "HIGH" && ctx.chatSafety.bookingSuggestion
          ? `${ctx.chatSafety.disclaimer}\n${ctx.chatSafety.bookingSuggestion}\n\n`
          : ctx.chatSafety?.disclaimer
            ? `${ctx.chatSafety.disclaimer}\n\n`
            : "";
      // Use scrubbed context for LLM prompt
      const prompt = `Context:\n${scrubbedContext.scrubbedText}\n\nSafety guidance:\n${ctx.chatSafety?.severity ?? "LOW"}\n\nUser message:\n${input.content}\n\nRespond briefly and include one follow-up question. Do not provide diagnosis or treatment advice.`;

      // Call LLM (falls back to empty string if API key not configured)
      let llmOutput = "";
      try {
        llmOutput = await callLLMAPI(prompt, systemPrompt);

        // Audit log for successful LLM call
        logLlmApiCall({
          userId,
          analysisId: input.analysisId,
          phiScrubbed: true,
          phiCount: scrubbedContext.matchCount,
          externalProvider: "llm",
          success: true,
        }).catch(() => {});
      } catch (err) {
        console.error("LLM call failed:", err);

        // Audit log for failed LLM call
        logLlmApiCall({
          userId,
          analysisId: input.analysisId,
          phiScrubbed: true,
          phiCount: scrubbedContext.matchCount,
          externalProvider: "llm",
          success: false,
        }).catch(() => {});

        llmOutput = "";
      }

      // AI-06: Medical Context Guardrails - Filter output
      let finalOutput = llmOutput;
      if (llmOutput) {
        const outputFilter = filterOutput(llmOutput);
        if (outputFilter.filteredContent) {
          finalOutput = outputFilter.filteredContent;
        }
        if (outputFilter.modifications.length > 0) {
          console.log(
            JSON.stringify({
              type: "output_filtered",
              modifications: outputFilter.modifications,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }

      // Fallback if LLM not configured
      const assistantContent = `${safetyPrefix}${finalOutput || `${docAnalysis.plainLanguageSummary || "I reviewed your results."}\n\nFollow-up: Can you tell me if you have any new symptoms or concerns?`}`;

      const assistantMessage = {
        role: "assistant",
        content: assistantContent,
        dialect: input.dialect,
      };

      // Save assistant message
      await ctx.db
        .insert(chatMessage)
        .values({
          analysisId: input.analysisId,
          userId,
          role: "assistant",
          content: assistantMessage.content,
          dialect: input.dialect,
        })
        .returning();

      return {
        userMessage: {
          role: "user",
          content: input.content,
          dialect: input.dialect,
        },
        assistantMessage,
        suggestedActions: ctx.chatSafety?.suggestedActions ?? [],
        safety: ctx.chatSafety,
        guardrailBlocked: false,
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
      const userId = ctx.session?.user?.id;
      if (!userId) {
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

      if (doc_analysis?.userId !== userId) {
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
      const userId = ctx.session?.user?.id;
      if (!userId) {
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

      if (doc_analysis?.userId !== userId) {
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
