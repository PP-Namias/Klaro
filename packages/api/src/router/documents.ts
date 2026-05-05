import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import { analysis, document } from "@klaro/db/schema";

import { protectedProcedure } from "../trpc";
import {
  buildOcrAudit,
  buildOcrResult,
  getOcrConfidenceThreshold,
} from "../services/ocr";
import { extractTestsFromText } from "../services/extraction";
import { generatePlainLanguageExplanation } from "../services/llm";

export const documentsRouter = {
  /**
   * Upload a medical document (PDF, image, etc.)
   * Triggers OCR processing asynchronously
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().max(255),
        mimeType: z.string().max(100).optional(),
        fileSize: z.number().optional(),
        storageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated to upload documents",
        });
      }

      const [doc] = await ctx.db
        .insert(document)
        .values({
          userId: ctx.session.user.id,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          storageUrl: input.storageUrl,
          status: "uploaded",
        })
        .returning();

      if (!doc) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document",
        });
      }

      const [docAnalysis] = await ctx.db
        .insert(analysis)
        .values({
          documentId: doc.id,
          userId: ctx.session.user.id,
          status: "pending",
        })
        .returning();

      return {
        id: doc.id,
        analysisId: docAnalysis?.id ?? null,
        status: "uploaded",
        message:
          "Document uploaded successfully. Processing will begin shortly.",
      };
    }),

  /**
   * attach ocr results to a document
   */
  setOcrResult: protectedProcedure
    .input(
      z.object({
        documentId: z.uuid(),
        ocrText: z.string().min(1),
        confidence: z.number().min(0).max(1).optional(),
        blocks: z
          .array(
            z.object({
              text: z.string(),
              confidence: z.number().min(0).max(1).optional(),
            }),
          )
          .optional(),
        source: z.enum(["local", "cloud"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.documentId));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this document",
        });
      }

      const result = buildOcrResult({
        text: input.ocrText,
        blocks: input.blocks,
        source: input.source,
      });

      const audit = buildOcrAudit({
        local: result.source === "local" ? result : undefined,
        cloud: result.source === "cloud" ? result : undefined,
        selected: result,
        usedCloudFallback: result.source === "cloud",
        threshold: getOcrConfidenceThreshold(),
      });

      const updatePayload: Partial<typeof document.$inferInsert> = {
        ocrText: result.text,
        status: "processing",
        ocrSource: result.source,
        ocrAudit: audit,
      };

      let resolvedConfidence = input.confidence;
      if (resolvedConfidence === undefined && input.blocks?.length) {
        resolvedConfidence = result.confidence;
      }

      if (resolvedConfidence !== undefined) {
        updatePayload.confidence = resolvedConfidence.toFixed(2);
      }

      const [updatedDoc] = await ctx.db
        .update(document)
        .set(updatePayload)
        .where(eq(document.id, input.documentId))
        .returning();

      if (!updatedDoc) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update OCR results",
        });
      }

      return {
        id: updatedDoc.id,
        status: updatedDoc.status,
      };
    }),

  /**
   * run extraction on stored ocr text
   */
  runExtraction: protectedProcedure
    .input(
      z.object({
        documentId: z.uuid(),
        ocrText: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.documentId));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this document",
        });
      }

      const ocrText = input.ocrText ?? doc.ocrText;
      if (!ocrText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OCR text is required before extraction",
        });
      }

      const extractedFields = extractTestsFromText(ocrText);
      const flaggedValues = extractedFields.filter((item) => item.flagged === true);

      const [analysisRow] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.documentId, input.documentId));

      if (!analysisRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis record not found",
        });
      }

      const extractionAccuracy =
        extractedFields.length > 0
          ? (extractedFields.filter((e) => e.value).length /
              extractedFields.length) *
            100
          : 0;

      await ctx.db
        .update(analysis)
        .set({
          extractedFields,
          flaggedValues,
          status: "extraction_complete",
          errorMessage: null,
        })
        .where(eq(analysis.id, analysisRow.id));

      await ctx.db
        .update(document)
        .set({ status: "extracted" })
        .where(eq(document.id, input.documentId));

      return {
        analysisId: analysisRow.id,
        extractedCount: extractedFields.length,
        flaggedCount: flaggedValues.length,
        accuracy: extractionAccuracy / 100,
        method: "regex",
      };
    }),

  /**
   * List all documents for the authenticated user
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const documents = await ctx.db
        .select()
        .from(document)
        .where(eq(document.userId, ctx.session.user.id))
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(document.createdAt);

      return documents;
    }),

  /**
   * Get a specific document by ID with its analysis
   */
  byId: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.id));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Fetch associated analysis
      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.documentId, input.id));

      return {
        document: doc,
        analysis: doc_analysis || null,
      };
    }),

  /**
   * Get document analysis results
   */
  getAnalysis: protectedProcedure
    .input(z.object({ documentId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc_analysis] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.documentId, input.documentId));

      if (!doc_analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis not found",
        });
      }

      // Verify user owns this document
      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.documentId));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this document",
        });
      }

      return doc_analysis;
    }),

  /**
   * Delete a document (soft delete by marking as deleted)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.id));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Update document status to archived (soft delete)
      // For now, we'll just delete it
      await ctx.db.delete(document).where(eq(document.id, input.id));

      return { success: true };
    }),

  /**
   * Process a document's image using server-side OCR and extract fields
   */
  processServerOcr: protectedProcedure
    .input(
      z.object({
        documentId: z.uuid(),
        base64Image: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.documentId));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this document",
        });
      }

      const { extractTestsFromText } = await import("../services/extraction");

      // convert base64 to buffer
      const buffer = Buffer.from(input.base64Image, "base64");
      
      // perform OCR
      const { performOcrWithFallback } = await import("../services/ocr");
      const { result: ocrResult, audit } = await performOcrWithFallback(buffer);

      // save OCR result to document
      await ctx.db
        .update(document)
        .set({
          ocrText: ocrResult.text,
          confidence: ocrResult.confidence.toFixed(2),
          ocrSource: ocrResult.source,
          ocrAudit: audit,
          status: "analyzed",
        })
        .where(eq(document.id, input.documentId));

      // extract tests
      const tests = extractTestsFromText(ocrResult.text);
      const flagged = tests.filter((t) => t.flag === "low" || t.flag === "high");

      // update analysis
      await ctx.db
        .update(analysis)
        .set({
          extractedFields: tests,
          flaggedValues: flagged,
          status: "completed",
        })
        .where(eq(analysis.documentId, input.documentId));

      return {
        ocrResult,
        extractedTests: tests,
      };
    }),

  /**
   * Generate plain-language explanation using LLM service
   * Requires extracted test fields to be present
   */
  generateAnalysis: protectedProcedure
    .input(
      z.object({
        documentId: z.uuid(),
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

      // Fetch document and verify ownership
      const [doc] = await ctx.db
        .select()
        .from(document)
        .where(eq(document.id, input.documentId));

      if (!doc || doc.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this document",
        });
      }

      // Fetch analysis with extracted fields
      const [analysisRecord] = await ctx.db
        .select()
        .from(analysis)
        .where(eq(analysis.documentId, input.documentId));

      if (!analysisRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis record not found",
        });
      }

      // Ensure extraction is complete
      if (!analysisRecord.extractedFields || analysisRecord.extractedFields.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Document must be extracted before analysis can be generated",
        });
      }

      try {
        // Generate plain-language explanation
        const llmResponse = await generatePlainLanguageExplanation(
          analysisRecord.extractedFields as any,
          input.dialect,
        );

        // Build Tanong-Mo card
        const tanqmoCard = {
          title:
            input.dialect === "Filipino"
              ? "Itatanong Mo Sa Doktor"
              : input.dialect === "Bisaya"
                ? "Pangutanon Para Sa Doktor"
                : "Itatanong Mo Sa Doktor",
          questions: llmResponse.questionsForDoctor.slice(0, 5),
          severity: llmResponse.severity,
          disclaimer: llmResponse.disclaimer,
          bookingCta: llmResponse.bookingPrompt,
        };

        // Update analysis record with generated content
        const [updated] = await ctx.db
          .update(analysis)
          .set({
            plainLanguageSummary: llmResponse.summary,
            tanqmoCard,
            status: "completed",
            errorMessage: null,
          })
          .where(eq(analysis.id, analysisRecord.id))
          .returning();

        return {
          analysisId: updated?.id,
          summary: llmResponse.summary,
          tests: llmResponse.tests,
          tanqmoCard,
          severity: llmResponse.severity,
          dialect: input.dialect,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Update analysis with error
        await ctx.db
          .update(analysis)
          .set({
            status: "error",
            errorMessage,
          })
          .where(eq(analysis.id, analysisRecord.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate analysis: ${errorMessage}`,
        });
      }
    }),
} satisfies TRPCRouterRecord;
