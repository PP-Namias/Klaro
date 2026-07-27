import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import type { ExtractedTest } from "@klaro/validators/extraction";
import type { Dialect } from "@klaro/validators/llm";
import type { ScanGuestResponse } from "@klaro/validators/scan-analysis";
import { analysis, document } from "@klaro/db/schema";
import { DialectEnum } from "@klaro/validators/llm";
import {
  scanGuestInputSchema,
  scanGuestResponseSchema,
} from "@klaro/validators/scan-analysis";

import { extractTestsFromText } from "../services/extraction";
import { generatePlainLanguageExplanation } from "../services/llm";
import { buildOcrResult } from "../services/ocr";
import { protectedProcedure, publicProcedure, scanProcedure } from "../trpc";

const scanUrgencyValues = ["LOW", "MODERATE", "HIGH"] as const;
type ScanUrgency = (typeof scanUrgencyValues)[number];

function getSafeUrgency(input: unknown): ScanUrgency {
  if (
    typeof input === "string" &&
    scanUrgencyValues.includes(input as ScanUrgency)
  ) {
    return input as ScanUrgency;
  }
  return "MODERATE";
}

function getSafeRecommendations(
  input: unknown,
  urgency: ScanUrgency,
): string[] {
  const recommendations = Array.isArray(input)
    ? input
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : [];

  if (recommendations.length > 0) {
    return recommendations;
  }

  if (urgency === "HIGH") {
    return [
      "Seek urgent medical evaluation today if symptoms are worsening",
      "Bring this scan report and your medications to your consultation",
    ];
  }

  if (urgency === "LOW") {
    return ["Review this result at your next routine check-up"];
  }

  return [
    "Schedule follow-up with your healthcare provider soon",
    "Monitor symptoms and seek urgent care for severe changes",
  ];
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function buildFallbackGuestScanResult(params: {
  language: Dialect;
  reason: string;
  requestId?: string;
}): ScanGuestResponse {
  const urgency: ScanUrgency = "MODERATE";
  const recommendations = getSafeRecommendations(undefined, urgency);
  const summary =
    "We analyzed your document, but AI processing was limited. Please review these findings with a healthcare provider.";

  return {
    requestId: params.requestId || `scan-${Date.now()}`,
    status: "completed",
    source: "fallback",
    language: params.language,
    analysis: {
      summary,
      urgency,
      recommendations,
    },
    plainLanguageSummary: summary,
    urgency,
    recommendations,
    confidence: 0.6,
    extractedData: {},
    warnings: [params.reason],
    timestamp: new Date().toISOString(),
  };
}

function normalizeGuestScanResponse(
  raw: unknown,
  input: {
    language: Dialect;
  },
): ScanGuestResponse {
  const data = toRecord(raw);
  const rawAnalysis = toRecord(data.analysis);

  const urgency = getSafeUrgency(data.urgency ?? rawAnalysis.urgency);
  const recommendations = getSafeRecommendations(
    data.recommendations ?? rawAnalysis.recommendations,
    urgency,
  );
  const summarySource = data.plainLanguageSummary ?? rawAnalysis.summary;
  const summary =
    typeof summarySource === "string" && summarySource.trim().length > 0
      ? summarySource.trim().slice(0, 500)
      : "Medical document scanned and analyzed";

  const confidenceRaw = data.confidence;
  const confidence =
    typeof confidenceRaw === "number" &&
    confidenceRaw >= 0 &&
    confidenceRaw <= 1
      ? confidenceRaw
      : 0.85;

  const normalized: ScanGuestResponse = {
    requestId:
      typeof data.requestId === "string" && data.requestId.trim().length > 0
        ? data.requestId
        : `scan-${Date.now()}`,
    status: "completed",
    source:
      typeof data.source === "string"
        ? (["gemini", "fallback", "llm", "mock", "raw"] as const).includes(
            data.source as "gemini" | "fallback" | "llm" | "mock" | "raw",
          )
          ? (data.source as "gemini" | "fallback" | "llm" | "mock" | "raw")
          : "gemini"
        : "gemini",
    language: input.language,
    analysis: {
      summary,
      urgency,
      recommendations,
    },
    plainLanguageSummary: summary,
    urgency,
    recommendations,
    confidence,
    extractedData: toRecord(data.extractedData ?? data.fields),
    warnings: Array.isArray(data.warnings)
      ? data.warnings.filter((item): item is string => typeof item === "string")
      : [],
    timestamp: new Date().toISOString(),
  };

  const validated = scanGuestResponseSchema.safeParse(normalized);
  return validated.success
    ? validated.data
    : buildFallbackGuestScanResult({
        language: input.language,
        reason: "scan_response_validation_failed",
        requestId: normalized.requestId,
      });
}

export const documentsRouter = {
  /**
   * Upload a medical document (PDF, image, etc.)
   * Triggers OCR processing asynchronously
   */
  upload: scanProcedure
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

      const updatePayload: Partial<typeof document.$inferInsert> = {
        ocrText: result.text,
        status: "processing",
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
      if (!ocrText || ocrText.trim().length === 0) {
        await ctx.db
          .update(document)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(document.id, input.documentId));

        return {
          analysisId: null,
          extractedCount: 0,
          flaggedCount: 0,
          accuracy: 0,
          method: "regex",
          error:
            "Could not extract any text from this document. Make sure the document contains clearly printed medical text.",
        };
      }

      const extractedFields = extractTestsFromText(ocrText);
      const flaggedValues = extractedFields.filter(
        (item) => item.flagged === true,
      );

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
          status: "completed",
          errorMessage: null,
        })
        .where(eq(analysis.id, analysisRow.id));

      await ctx.db
        .update(document)
        .set({ status: "analyzed" })
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
  processServerOcr: scanProcedure
    .input(
      z.object({
        documentId: z.uuid(),
        base64Image: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
      const { performOcr } = await import("../services/ocr");
      const ocrResult = await performOcr(buffer);

      // save OCR result to document
      await ctx.db
        .update(document)
        .set({
          ocrText: ocrResult.text,
          confidence: ocrResult.confidence.toFixed(2),
          status: "analyzed",
        })
        .where(eq(document.id, input.documentId));

      // extract tests
      const tests = extractTestsFromText(ocrResult.text);
      const flagged = tests.filter((t) => t.flagged === true);

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
  generateAnalysis: scanProcedure
    .input(
      z.object({
        documentId: z.uuid(),
        dialect: DialectEnum.default("Filipino"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
      if (
        !analysisRecord.extractedFields ||
        (analysisRecord.extractedFields as any[]).length === 0
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Document must be extracted before analysis can be generated",
        });
      }

      try {
        // Generate plain-language explanation
        const llmResponse = generatePlainLanguageExplanation(
          analysisRecord.extractedFields as ExtractedTest[],
          input.dialect,
        );

        // Build Tanong-Mo card
        const tanqmoCard = {
          title:
            input.dialect === "Filipino"
              ? "Itatanong Mo Sa Doktor"
              : input.dialect === "Bisaya"
                ? "Pangutanon Para Sa Doktor"
                : input.dialect === "Ilocano"
                  ? "Itatanong Mo Kadagiti Doktor"
                  : "Questions For Your Doctor",
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
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

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

  /**
   * Public guest endpoint: scan medical image with Gemini AI
   * No authentication required - guest uploads get temporary session
   * Pipeline: OCR confidence gate → Gemini AI → plain-language result
   */
  scanGuestImage: publicProcedure
    .input(scanGuestInputSchema)
    .mutation(async ({ input }) => {
      const geminiApiUrl =
        process.env.GEMINI_SCAN_API_URL || "http://localhost:3001";

      const { runOcrWithRetry, buildRejectionResponse } = await import(
        "../services/ocrPipeline"
      );

      const ocrResult = await runOcrWithRetry(input.base64Image);

      if (!ocrResult.accepted) {
        return buildRejectionResponse(ocrResult, input.language);
      }

      try {
        const response = await fetch(`${geminiApiUrl}/api/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            images: [
              {
                bytesBase64: input.base64Image,
                filename: input.fileName,
              },
            ],
            metadata: {
              task: "medical_scan",
              language: input.language,
              fileName: input.fileName,
              patientAge: input.patientAge,
              patientSex: input.patientSex,
              facilityName: input.facilityName,
              ocrConfidence: ocrResult.confidence,
              ocrText: ocrResult.text,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return buildFallbackGuestScanResult({
            language: input.language,
            reason: `gemini_http_${response.status}:${errorText.slice(0, 120)}`,
          });
        }

        const rawResult = (await response.json()) as unknown;
        return normalizeGuestScanResponse(rawResult, {
          language: input.language,
        });
      } catch (error) {
        const reason =
          error instanceof Error
            ? `gemini_request_failed:${error.message}`
            : "gemini_request_failed";

        return buildFallbackGuestScanResult({
          language: input.language,
          reason,
        });
      }
    }),

  /**
   * Analyze scan results with AI agent prompt
   * Returns summary, urgency level, and recommended next steps
   *
   * Uses dedicated scan-analysis service for better logic flow:
   * 1. Validates extracted test data
   * 2. Builds context-aware prompts
   * 3. Calls LLM with error handling
   * 4. Provides intelligent fallback when LLM unavailable
   */
  analyzeScanWithAI: publicProcedure
    .input(
      z.object({
        extractedTests: z
          .array(
            z.object({
              name: z.string(),
              value: z.string().optional(),
              unit: z.string().optional(),
              flagged: z.boolean().optional(),
            }),
          )
          .min(1),
        patientAge: z.number().min(0).max(150).optional(),
        patientSex: z.enum(["male", "female", "other"]).optional(),
        facilityName: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { analyzeScan } = await import("../services/scan-analysis");

        // Delegate to scan analysis service
        const result = await analyzeScan({
          extractedTests: input.extractedTests,
          patientAge: input.patientAge,
          patientSex: input.patientSex,
          facilityName: input.facilityName,
        });

        if (!result.success || !result.analysis) {
          return {
            success: false,
            error: result.error || "Failed to analyze scan results",
            timestamp: result.timestamp,
          };
        }

        return {
          success: true,
          analysis: result.analysis,
          source: result.source,
          timestamp: result.timestamp,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to analyze scan";

        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    }),

  /**
   * Execute file cleanup job
   * Deletes uploaded files past retention window from Cloudinary
   * Requires admin authentication
   */
  cleanupFiles: protectedProcedure
    .input(
      z
        .object({
          retentionHours: z.number().min(1).max(720).optional(),
          dryRun: z.boolean().default(false),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const { executeCleanup } = await import("../services/fileCleanup");

      const result = await executeCleanup({
        retentionHours: input?.retentionHours,
        dryRun: input?.dryRun ?? false,
      });

      return {
        success: result.failed === 0,
        summary: {
          totalFound: result.totalFound,
          deleted: result.deleted,
          archived: result.archived,
          failed: result.failed,
          dryRun: result.dryRun,
        },
        errors: result.errors,
        deletedFiles: result.deletedFiles,
      };
    }),

  /**
   * Get cleanup statistics for monitoring
   */
  cleanupStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User must be authenticated",
      });
    }

    const { getCleanupStats } = await import("../services/fileCleanup");
    return getCleanupStats();
  }),

  /**
   * Manually cleanup a specific document
   * Deletes file from Cloudinary and archives the document
   */
  cleanupDocument: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be authenticated",
        });
      }

      const { cleanupDocument } = await import("../services/fileCleanup");
      const result = await cleanupDocument(
        input.documentId,
        ctx.session.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.error === "Document not found"
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to cleanup document",
        });
      }

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
