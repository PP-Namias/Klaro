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
