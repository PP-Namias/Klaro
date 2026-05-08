import { z } from "zod/v4";

export const aiScanAnalysisSchema = z.object({
  summary: z.string().max(500),
  urgency: z.enum(["LOW", "MODERATE", "HIGH"]),
  recommendations: z.array(z.string().max(500)).min(1).max(3),
});

export type AIScanAnalysis = z.infer<typeof aiScanAnalysisSchema>;

export const analyzeScanInputSchema = z.object({
  extractedTests: z.array(
    z.object({
      name: z.string(),
      value: z.string().optional(),
      unit: z.string().optional(),
      flagged: z.boolean().optional(),
    }),
  ),
  patientAge: z.number().optional(),
  patientSex: z.enum(["male", "female", "other"]).optional(),
});

export type AnalyzeScanInput = z.infer<typeof analyzeScanInputSchema>;

export const scanUrgencySchema = z.enum(["LOW", "MODERATE", "HIGH"]);
export const scanLanguageSchema = z.enum(["Filipino", "English"]);
export const scanStatusSchema = z.enum(["completed", "error"]);

const base64ImageSchema = z
  .string()
  .trim()
  .min(100)
  .regex(/^[A-Za-z0-9+/=\r\n]+$/, "base64Image must be a valid base64 string")
  .refine(
    (value) => value.replace(/[\r\n]/g, "").length % 4 === 0,
    "base64Image appears to be malformed",
  );

export const scanGuestInputSchema = z.object({
  base64Image: base64ImageSchema,
  fileName: z.string().trim().min(1).max(255).optional(),
  language: scanLanguageSchema.default("English"),
  patientAge: z.number().int().min(0).max(150).optional(),
  patientSex: z.enum(["male", "female", "other"]).optional(),
  facilityName: z.string().trim().min(1).max(255).optional(),
});

export const scanGuestAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  urgency: scanUrgencySchema,
  recommendations: z.array(z.string().trim().min(1).max(500)).min(1).max(3),
});

export const scanGuestResponseSchema = z.object({
  requestId: z.string().min(1),
  status: scanStatusSchema,
  source: z.enum(["gemini", "fallback", "llm", "mock", "raw"]).optional(),
  language: scanLanguageSchema,
  analysis: scanGuestAnalysisSchema.optional(),
  plainLanguageSummary: z.string().max(500).optional(),
  urgency: scanUrgencySchema.optional(),
  recommendations: z.array(z.string().max(500)).optional(),
  confidence: z.number().min(0).max(1).optional(),
  extractedData: z.record(z.string(), z.unknown()).optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
  timestamp: z.iso.datetime(),
});

export type ScanGuestInput = z.infer<typeof scanGuestInputSchema>;
export type ScanGuestResponse = z.infer<typeof scanGuestResponseSchema>;
