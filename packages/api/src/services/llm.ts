import type { ExtractedTest } from "@klaro/validators/extraction";
import type {
  Dialect,
  LLMResponse,
  Severity,
  TanongMoCard,
} from "@klaro/validators/llm";

/**
 * LLM Configuration
 * Supports multiple providers: OpenAI, Claude, Gemini
 */
interface LLMConfig {
  provider?: "openai" | "claude" | "gemini";
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: (process.env.LLM_PROVIDER as "openai" | "claude" | "gemini") || "gemini",
  apiKey: process.env.LLM_API_KEY,
  model:
    process.env.LLM_MODEL ||
    (process.env.LLM_PROVIDER === "openai"
      ? "gpt-4-turbo"
      : process.env.LLM_PROVIDER === "claude"
        ? "claude-3-sonnet-20240229"
        : "gemini-1.5-pro"),
  temperature: 0.7,
  maxTokens: 1000,
};

/**
 * Prompt versioning for A/B testing
 * Each prompt version can be toggled to test different approaches
 */
interface PromptVersion {
  id: string;
  version: number;
  provider: "openai" | "claude" | "gemini";
  promptTemplate: string;
  active: boolean;
  createdAt: Date;
  metrics?: {
    usageCount: number;
    avgQualityScore?: number;
  };
}

/**
 * In-memory prompt store (in production, use database)
 * Store format: promptVersions[promptType][dialect][version]
 */
const promptVersions: Record<string, Record<Dialect, PromptVersion[]>> = {
  explanation: {
    Filipino: [],
    Bisaya: [],
    Ilocano: [],
  },
  tanqmo: {
    Filipino: [],
    Bisaya: [],
    Ilocano: [],
  },
};

/**
 * Severity scoring based on reference ranges and flags
 * Maps test result flags to severity levels
 */
function computeSeverity(flags: boolean[]): Severity {
  if (flags.length === 0) return "LOW";

  const abnormalCount = flags.filter((f) => f).length;
  const abnormalPercentage = abnormalCount / flags.length;

  if (abnormalPercentage >= 0.5) return "HIGH";
  if (abnormalPercentage >= 0.3) return "MODERATE";
  return "LOW";
}

/**
 * Prompt template for plain-language explanation
 * Returns a system prompt that guides LLM to produce readable output
 */
function getExplanationPrompt(dialect: Dialect, severity: Severity): string {
  const baseInstructions = `You are a helpful health assistant speaking to a Filipino patient. Your task is to explain medical test results in plain language.

## Rules:
- Use simple words that an 8th-grade student can understand
- Avoid medical jargon; use analogies if needed
- Be supportive and reassuring when results are normal
- Be clear about risks if results are abnormal
- Keep explanations to max 200 words
- Use the patient's preferred dialect (${dialect})
- Format response as JSON with fields: summary, testExplanations, severity, questionsForDoctor

## Test Explanations Should Include:
- What the test measures
- What your result means
- Whether it's normal or abnormal
- One suggested next step`;

  const dialectSpecificInstructions = getDialectInstructions(dialect);
  const severityNote =
    severity === "HIGH"
      ? "\n\n⚠️ IMPORTANT: Results show abnormal values. Include a disclaimer that patient should see a doctor soon and offer booking option."
      : severity === "MODERATE"
        ? "\n⚠️ Some results are outside normal range. Suggest scheduling a check-up."
        : "";

  return baseInstructions + dialectSpecificInstructions + severityNote;
}

/**
 * Dialect-specific prompt additions
 */
function getDialectInstructions(dialect: Dialect): string {
  const instructions: Record<Dialect, string> = {
    Filipino: `
## Filipino (Tagalog) Guidelines:
- Use formal but warm tone (tulad ng pambubuo makipag-ugnayan sa kapitbayan)
- Example openings: "Ang iyong resulta ay nagpapakita...", "Ipinapakita nito na..."
- Use common Filipino health terms patients understand
- Include Filipino idioms for comfort when appropriate`,
    Bisaya: `
## Bisaya Guidelines:
- Use informal but respectful tone
- Example openings: "Ang imong resulta nagpakita...", "Tanda nang..."
- Use Visayan common health terms
- Be friendly and approachable in tone`,
    Ilocano: `
## Ilocano Guidelines:
- Use respectful and direct tone
- Example openings: "Ang risultado mo ay nagpapakita...", "Ito ay nangangahulugang..."
- Use Ilocano health terminology
- Keep explanations practical and action-oriented`,
  };

  return instructions[dialect] ?? "";
}

/**
 * Prompt template for Tanong Mo Sa Doktor card
 */
function getTanongMoPrompt(
  dialect: Dialect,
  flaggedTests: ExtractedTest[],
): string {
  const testList = flaggedTests
    .map((t: ExtractedTest) => `- ${t.name} (${t.value}${t.unit ? " " + t.unit : ""})`)
    .join("\n");

  return `You are helping a Filipino patient prepare for a doctor visit. 
Generate 3-5 specific, actionable questions the patient should ask their doctor about these test results:

${testList}

## Guidelines:
- Questions should be in the patient's dialect (${dialect})
- Focus on what results mean for their health
- Ask about next steps or treatments
- Make questions simple and direct
- Output as JSON array: ["question 1", "question 2", ...]`;
}

/**
 * Generate plain-language explanation from extracted test results
 * Simulates LLM call with structured response
 *
 * NOTE: In production, this would call OpenAI/Claude/Gemini API
 * For now, we generate structured responses based on test data
 */
export async function generatePlainLanguageExplanation(
  extractedTests: ExtractedTest[],
  dialect: Dialect = "Filipino",
): Promise<LLMResponse> {
  // Separate normal and flagged tests
  const flaggedTests = extractedTests.filter((t) => t.flagged);
  const severity = computeSeverity(extractedTests.map((t) => t.flagged ?? false));

  // Get dialect-specific greeting
  const greetings: Record<Dialect, string> = {
    Filipino:
      "Ang iyong mga resulta ay nagpapakita ng iyong kasalukuyang kalusugan.",
    Bisaya:
      "Ang imong mga resulta ay nagpakita sa imong kasagaran na kalusugan.",
    Ilocano:
      "Ang iyong mga resulta ay nagpakita sa iyong panglalaking kalusugan.",
  };

  // Build test explanations
  const tests = extractedTests.map((test) => ({
    name: test.name,
    value: test.value,
    interpretation:
      test.flagged === true
        ? getAbnormalInterpretation(test, dialect)
        : getNormalInterpretation(test, dialect),
    recommendation: test.flagged === true ? getRecommendation(test, dialect) : undefined,
  }));

  // Generate questions for doctor
  const questionsForDoctor = generateQuestionsForDoctor(flaggedTests, dialect);

  // Build tanqmo card
  const tanqmoCard: TanongMoCard = {
    title: getTanongMoTitle(dialect),
    questions: questionsForDoctor.slice(0, 5),
    severity,
    disclaimer:
      severity === "HIGH" ? getSafetyDisclaimer(dialect) : undefined,
    bookingCta: severity === "HIGH" ? getBookingCTA(dialect) : undefined,
  };

  // Build summary
  const summary = buildSummary(
    extractedTests.length,
    flaggedTests.length,
    severity,
    dialect,
  );

  return {
    summary,
    tests,
    questionsForDoctor,
    severity,
    disclaimer: tanqmoCard.disclaimer,
    bookingPrompt: tanqmoCard.bookingCta,
  };
}

/**
 * Helper: Interpretation for abnormal values
 */
function getAbnormalInterpretation(test: ExtractedTest, dialect: Dialect): string {
  const interpretations: Record<Dialect, string> = {
    Filipino: `Ang iyong ${test.name} ay mas mataas/mababa kaysa normal. Ito ay dapat bahagin ng doktor.`,
    Bisaya: `Ang iyong ${test.name} ay mas taas/mubo kaysa sa normal. Kailangan ikonsulta ang doktor.`,
    Ilocano: `Ang iyong ${test.name} ay nagtaas/nagbaba pay sa normal. Dapat kita sa doktor.`,
  };

  return interpretations[dialect] ?? interpretations["Filipino"];
}

/**
 * Helper: Interpretation for normal values
 */
function getNormalInterpretation(test: ExtractedTest, dialect: Dialect): string {
  const interpretations: Record<Dialect, string> = {
    Filipino: `Ang iyong ${test.name} ay nasa normal na saklaw. Maganda ito.`,
    Bisaya: `Ang iyong ${test.name} ay normal. Maayo niini.`,
    Ilocano: `Ang iyong ${test.name} ay normal. Nasapa niito.`,
  };

  return interpretations[dialect] ?? interpretations["Filipino"];
}

/**
 * Helper: Recommendation for abnormal values
 */
function getRecommendation(test: ExtractedTest, dialect: Dialect): string {
  const recommendations: Record<Dialect, string> = {
    Filipino: `Konsultahin ang isang doktor tungkol sa ${test.name}.`,
    Bisaya: `Konsultahin ang doktor tungkol sa ${test.name}.`,
    Ilocano: `Kita sa doktor para sa ${test.name}.`,
  };

  return recommendations[dialect] ?? recommendations["Filipino"];
}

/**
 * Helper: Generate questions for doctor
 */
function generateQuestionsForDoctor(
  flaggedTests: ExtractedTest[],
  dialect: Dialect,
): string[] {
  if (flaggedTests.length === 0) {
    return [getFollowUpQuestion(dialect)];
  }

  const questions: Record<Dialect, string[]> = {
    Filipino: [
      `Bakit mataas/mababa ang aking ${flaggedTests[0]?.name || "resulta"}?`,
      `Paano ako magpapabuti ng aking ${flaggedTests[0]?.name || "kalusugan"}?`,
      `Kailangan ko ba ng gamot para dito?`,
      `Kailan dapat akong magbalik para sa susulong na eksamen?`,
      `May riziko ba ito para sa akin?`,
    ],
    Bisaya: [
      `Ngano mataas/mubo ang akong ${flaggedTests[0]?.name || "resulta"}?`,
      `Unsaon ko pamaayuon ang akong ${flaggedTests[0]?.name || "kalusugan"}?`,
      `Kinahangloan ko ba ng tambal para niini?`,
      `Kailan man ko dapat bumalik sa iabang eksamen?`,
      `May peligro ba ito para sa akin?`,
    ],
    Ilocano: [
      `Apay nagtaas/nagbaba ang akong ${flaggedTests[0]?.name || "resulta"}?`,
      `Paano ko pabilisin ang akong ${flaggedTests[0]?.name || "kalusugan"}?`,
      `Gapu met ba sa akin ng gamot para ditoy?`,
      `Kailan talaga dapat bumalik para sa mainasnang eksamen?`,
      `May kakaibang panganib ba ditoy para sa akin?`,
    ],
  };

  return (questions[dialect] ?? []).slice(0, Math.min(3, flaggedTests.length + 2));
}

/**
 * Helper: Follow-up question when all results normal
 */
function getFollowUpQuestion(dialect: Dialect): string {
  const questions: Record<Dialect, string> = {
    Filipino: "Ano ang dapat kong gawin para manatiling malusog?",
    Bisaya: "Unsaon ko man panatilihin ang aking kalusugan?",
    Ilocano: "Apay ti dapat ko a gawin para manatili a malusog?",
  };

  return questions[dialect] ?? questions["Filipino"];
}

/**
 * Helper: Tanqmo card title
 */
function getTanongMoTitle(dialect: Dialect): string {
  const titles: Record<Dialect, string> = {
    Filipino: "Itatanong Mo Sa Doktor",
    Bisaya: "Pangutanon Para Sa Doktor",
    Ilocano: "Itatanong Mo Sa Doktor",
  };

  return titles[dialect] ?? titles["Filipino"];
}

/**
 * Helper: Safety disclaimer
 */
function getSafetyDisclaimer(dialect: Dialect): string {
  const disclaimers: Record<Dialect, string> = {
    Filipino:
      "⚠️ Ang ilang resulta ay hindi normal. Mahalaga na makita mo ang isang doktor kaagad.",
    Bisaya:
      "⚠️ Ang ilang resulta ay hindi normal. Mahalaga na makita mo ang isang doktor kaagad.",
    Ilocano:
      "⚠️ Ang napadaan a resulta ay saan normal. Mahalaga na makita mo ti doktor.",
  };

  return disclaimers[dialect] ?? disclaimers["Filipino"];
}

/**
 * Helper: Booking CTA
 */
function getBookingCTA(dialect: Dialect): string {
  const ctas: Record<Dialect, string> = {
    Filipino: "📞 Mag-book ng appointment sa isang doktor ngayon",
    Bisaya: "📞 Mag-book ug appointment sa doktor karon",
    Ilocano: "📞 Mag-book ug appointment sa doktor dita",
  };

  return ctas[dialect] ?? ctas["Filipino"];
}

/**
 * Helper: Build summary
 */
function buildSummary(
  totalTests: number,
  flaggedCount: number,
  severity: Severity,
  dialect: Dialect,
): string {
  if (flaggedCount === 0) {
    const summaries: Record<Dialect, string> = {
      Filipino: `Maganda! Ang lahat ng ${totalTests} results ay normal. Patuloy na alagaan ang iyong kalusugan.`,
      Bisaya: `Maayo! Ang tanan mga ${totalTests} resulta ay normal. Magpatuloy sa pag-aaga sa imong kalusugan.`,
      Ilocano: `Nasapa! Ang amin mga ${totalTests} resulta ay normal. Tuloy ang pag-aaga sa iyong kalusugan.`,
    };
    return summaries[dialect];
  }

  const summaries: Record<Dialect, Record<Severity, string>> = {
    Filipino: {
      LOW: `May ${flaggedCount} resulta na hindi normal sa ${totalTests} tests. Dapat konsultahin ang doktor.`,
      MODERATE: `May ${flaggedCount} abnormal na resulta sa ${totalTests} tests. Dapat makakuha ng propesyonal na payo.`,
      HIGH: `May ${flaggedCount} significantly abnormal na resulta. Kailangan agad na makita ang doktor.`,
    },
    Bisaya: {
      LOW: `May ${flaggedCount} resulta na hindi normal sa ${totalTests} tests. Dapat konsultahin ang doktor.`,
      MODERATE: `May ${flaggedCount} hindi normal na resulta sa ${totalTests} tests. Dapat makakuha ng propesyonal na payo.`,
      HIGH: `May ${flaggedCount} significantly abnormal na resulta. Kailangan agad na makita ang doktor.`,
    },
    Ilocano: {
      LOW: `May ${flaggedCount} resulta na saan normal sa ${totalTests} tests. Dapat kita sa doktor.`,
      MODERATE: `May ${flaggedCount} saan normal na resulta sa ${totalTests} tests. Dapat makakuha iti propesyonal a payo.`,
      HIGH: `May ${flaggedCount} significantly abnormal na resulta. Kailangan agad na makita ang doktor.`,
    },
  };

  return summaries[dialect][severity];
}

/**
 * Compute severity for tRPC response
 */
export function computeSeverityForTests(tests: ExtractedTest[]): Severity {
  const flags = tests.map((t) => t.flagged ?? false);
  return computeSeverity(flags);
}

/**
 * Call actual LLM API with fallback to rule-based generation
 * Supports OpenAI, Claude, and Gemini APIs
 */
export async function callLLMAPI(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig = DEFAULT_LLM_CONFIG,
): Promise<string> {
  // If no API key configured, fall back to rule-based generation
  if (!config.apiKey || !config.provider) {
    console.warn(
      `LLM_API_KEY not configured for provider ${config.provider}. Using rule-based generation.`,
    );
    return "";
  }

  try {
    if (config.provider === "openai") {
      return await callOpenAI(prompt, systemPrompt, config);
    } else if (config.provider === "claude") {
      return await callClaude(prompt, systemPrompt, config);
    } else if (config.provider === "gemini") {
      return await callGemini(prompt, systemPrompt, config);
    }
  } catch (error) {
    console.error(`LLM API call failed for ${config.provider}:`, error);
    // Fall back to rule-based generation
    return "";
  }

  return "";
}

/**
 * Call OpenAI API (GPT-4 or GPT-3.5)
 */
async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content || "";
}

/**
 * Call Claude API (Anthropic)
 */
async function callClaude(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-3-sonnet-20240229",
      max_tokens: config.maxTokens ?? 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content[0]?.text || "";
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  prompt: string,
  systemPrompt: string,
  config: LLMConfig,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model || "gemini-1.5-pro"}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 1000,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content.parts[0]?.text || "";
}

/**
 * Register a new prompt version for A/B testing
 */
export function registerPromptVersion(
  promptType: "explanation" | "tanqmo",
  dialect: Dialect,
  promptTemplate: string,
  provider: "openai" | "claude" | "gemini" = "gemini",
): PromptVersion {
  const versions = promptVersions[promptType]?.[dialect] || [];
  const newVersion: PromptVersion = {
    id: `${promptType}-${dialect}-${Date.now()}`,
    version: versions.length + 1,
    provider,
    promptTemplate,
    active: true,
    createdAt: new Date(),
    metrics: { usageCount: 0, avgQualityScore: 0 },
  };

  if (!promptVersions[promptType]) {
    promptVersions[promptType] = {
      Filipino: [],
      Bisaya: [],
      Ilocano: [],
    };
  }

  // Deactivate all previous versions
  promptVersions[promptType][dialect].forEach((v) => {
    v.active = false;
  });

  // Add new version
  promptVersions[promptType][dialect].push(newVersion);

  return newVersion;
}

/**
 * Get active prompt version for a dialect
 */
export function getActivePromptVersion(
  promptType: "explanation" | "tanqmo",
  dialect: Dialect,
): PromptVersion | null {
  const versions = promptVersions[promptType]?.[dialect] || [];
  return versions.find((v) => v.active) || null;
}

/**
 * Get all prompt versions (for admin interface)
 */
export function getAllPromptVersions(
  promptType?: "explanation" | "tanqmo",
): Record<string, PromptVersion[]> {
  if (promptType) {
    return {
      [promptType]: Object.entries(promptVersions[promptType] || {}).reduce(
        (acc, [dialect, versions]) => {
          acc[dialect] = versions;
          return acc;
        },
        {} as Record<Dialect, PromptVersion[]>,
      ),
    };
  }

  return promptVersions;
}

/**
 * Log prompt usage for metrics tracking
 */
export function logPromptUsage(
  promptType: "explanation" | "tanqmo",
  dialect: Dialect,
  qualityScore?: number,
): void {
  const version = getActivePromptVersion(promptType, dialect);
  if (version && version.metrics) {
    version.metrics.usageCount++;
    if (qualityScore !== undefined && version.metrics.avgQualityScore !== undefined) {
      // Calculate running average
      version.metrics.avgQualityScore =
        (version.metrics.avgQualityScore * (version.metrics.usageCount - 1) +
          qualityScore) /
        version.metrics.usageCount;
    }
  }
}

/**
 * Export prompt templates for documentation/debugging
 */
export const PROMPT_TEMPLATES = {
  explanation: getExplanationPrompt,
  tanqmo: getTanongMoPrompt,
  dialects: {
    Filipino: "Tagalog - Main language",
    Bisaya: "Visayan - Cebuano variant",
    Ilocano: "Ilocano - Northern Philippine language",
  },
};
