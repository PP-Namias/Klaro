import { z } from "zod/v4";

export const ExtractedTestSchema = z.object({
  name: z.string().min(1, "Test name required"),
  value: z.string().regex(/^[\d.]+$/, "Value must be numeric"),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  flagged: z.boolean().optional().default(false),
});

export type ExtractedTest = z.infer<typeof ExtractedTestSchema>;

export const ExtractedTestsSchema = z.array(ExtractedTestSchema);

export const ExtractionResultSchema = z.object({
  documentId: z.string().uuid(),
  tests: ExtractedTestsSchema,
  accuracy: z.number().min(0).max(1),
  processedAt: z.date(),
  method: z.enum(["regex", "llm", "hybrid"]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
