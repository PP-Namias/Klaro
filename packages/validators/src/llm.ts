import { z } from "zod/v4";

/**
 * Severity levels for medical results
 * Used to trigger safety warnings and booking CTAs
 */
export const SeverityEnum = z.enum(["LOW", "MODERATE", "HIGH"]);
export type Severity = z.infer<typeof SeverityEnum>;

/**
 * Supported dialects for plain-language explanations
 */
export const DialectEnum = z.enum(["Filipino", "Bisaya", "Ilocano"]);
export type Dialect = z.infer<typeof DialectEnum>;

/**
 * Individual test explanation
 */
export const TestExplanationSchema = z.object({
  name: z.string().describe("Canonical test name"),
  value: z.string().optional().describe("Test result value"),
  interpretation: z
    .string()
    .max(150)
    .describe("Plain-language interpretation (no jargon)"),
  recommendation: z
    .string()
    .max(100)
    .optional()
    .describe("Suggested next step or action"),
});
export type TestExplanation = z.infer<typeof TestExplanationSchema>;

/**
 * Tanong Mo Sa Doktor card (questions to ask doctor)
 */
export const TanongMoCardSchema = z.object({
  title: z.string().describe("Card title (e.g., 'Itatanong Mo Sa Doktor')"),
  questions: z
    .array(z.string().max(100))
    .min(1)
    .max(5)
    .describe("1-5 specific questions based on flagged results"),
  severity: SeverityEnum.describe("Severity level of results"),
  disclaimer: z
    .string()
    .optional()
    .describe("Safety disclaimer if severity HIGH"),
  bookingCta: z
    .string()
    .optional()
    .describe("Booking call-to-action text when severity HIGH"),
});
export type TanongMoCard = z.infer<typeof TanongMoCardSchema>;

/**
 * Complete plain-language analysis result
 */
export const PlainLanguageAnalysisSchema = z.object({
  summary: z.string().max(500).describe("Overall plain-language summary"),
  tests: z
    .array(TestExplanationSchema)
    .describe("Explanation for each flagged test"),
  tanqmo: TanongMoCardSchema.describe("Tanong Mo Sa Doktor card"),
  severity: SeverityEnum.describe("Overall severity assessment"),
  dialect: DialectEnum.describe("Dialect used for explanations"),
});
export type PlainLanguageAnalysis = z.infer<typeof PlainLanguageAnalysisSchema>;

/**
 * LLM input request
 */
export const GenerateExplanationInputSchema = z.object({
  documentId: z.string().uuid().describe("Document ID"),
  dialect: DialectEnum.default("Filipino").describe("Target dialect"),
  includeDisclaimers: z
    .boolean()
    .default(true)
    .describe("Whether to include safety disclaimers"),
});
export type GenerateExplanationInput = z.infer<
  typeof GenerateExplanationInputSchema
>;

/**
 * Structured LLM response before DB persistence
 */
export const LLMResponseSchema = z.object({
  summary: z.string().describe("Plain-language summary"),
  tests: z.array(TestExplanationSchema).describe("Per-test explanations"),
  questionsForDoctor: z.array(z.string()).describe("Questions to ask doctor"),
  severity: SeverityEnum.describe("Severity: LOW, MODERATE, HIGH"),
  disclaimer: z.string().optional().describe("Disclaimer for HIGH severity"),
  bookingPrompt: z.string().optional().describe("Booking suggestion text"),
});
export type LLMResponse = z.infer<typeof LLMResponseSchema>;

/**
 * Prompt template configuration (for versioning)
 */
export const PromptTemplateSchema = z.object({
  id: z.string().describe("Unique template ID"),
  version: z.number().describe("Template version (for A/B testing)"),
  dialect: DialectEnum.describe("Target dialect"),
  name: z.string().describe("Human-readable template name"),
  created: z.date().describe("Creation timestamp"),
  active: z.boolean().default(true).describe("Whether this template is active"),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
